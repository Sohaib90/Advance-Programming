package main

import (
    "fmt"
    "os"
    "strconv"
    "math"
	"encoding/csv"
    "sync"
)

type CensusGroup struct {
	population int
	latitude, longitude float64
}

func ParseCensusData(fname string) ([]CensusGroup, error) {
	file, err := os.Open(fname)
    if err != nil {
		return nil, err
    }
    defer file.Close()

	records, err := csv.NewReader(file).ReadAll()
	if err != nil {
		return nil, err
	}
	censusData := make([]CensusGroup, 0, len(records))

    for _, rec := range records {
        if len(rec) == 7 {
            population, err1 := strconv.Atoi(rec[4])
            latitude, err2 := strconv.ParseFloat(rec[5], 64)
            longitude, err3 := strconv.ParseFloat(rec[6], 64)
            if err1 == nil && err2 == nil && err3 == nil {
                latpi := latitude * math.Pi / 180
                latitude = math.Log(math.Tan(latpi) + 1 / math.Cos(latpi))
                censusData = append(censusData, CensusGroup{population, latitude, longitude})
            }
        }
    }

	return censusData, nil
}

func normalize_lat(number float64,max float64,min float64, ydim int)(int){
    yd := float64(ydim)
    norm := ((number- min)/(max-min))*(yd)+1
    if (int(norm) >= ydim){
    	norm2:= int(norm)
    	norm2 = norm2-1
    	return norm2
    }
   	return int(norm)
}


func normalize_long(number float64,max float64,min float64, xdim int)(int){
    xd := float64(xdim)
    norm := ((number- min)/(max-min))*(xd)+1
    if (int(norm) >= xdim) {
    	norm2 := int(norm)
    	norm2 = norm2-1
    	return norm2
    }
    return int(norm)
}

func max_min_parallel(array[] CensusGroup, key_chan chan float64){
    if (len(array)>20000) {
        chn := make(chan float64)
        chn2 := make(chan float64)
        mid := len(array)/2
        go max_min_parallel(array[:mid],chn)
        go max_min_parallel(array[mid:],chn2)
        left_max_lat := <-chn
        left_min_lat := <-chn
        left_max_long := <-chn
        left_min_long := <-chn
        left_total := <-chn
        right_max_lat := <-chn2
        right_min_lat := <-chn2
        right_max_long := <-chn2
        right_min_long := <-chn2
        right_total := <-chn2
        key_chan <- math.Max(left_max_lat,right_max_lat)
        key_chan <- math.Min(left_min_lat,right_min_lat)
        key_chan <- math.Max(left_max_long,right_max_long)
        key_chan <- math.Min(left_min_long,right_min_long)
        key_chan<- left_total+right_total

    } else{
        max_lat := array[0].latitude
        min_lat := array[0].latitude
        max_long := array[0].longitude
        min_long := array[0].longitude
        total2 := 0
    
        for i:=0 ; i< len(array); i++ {
             if (array[i].latitude >= max_lat){
                max_lat = array[i].latitude
             }
             if (array[i].latitude <= min_lat) {
                min_lat = array[i].latitude                 
             }
             if (array[i].longitude >= max_long) {
                max_long = array[i].longitude                 
             }
             if (array[i].longitude <= min_long) {
                min_long = array[i].longitude                 
             }
             total2= total2+array[i].population
          }
    
          key_chan<-max_lat
          key_chan<-min_lat
          key_chan<-max_long
          key_chan<-min_long
          key_chan<-float64(total2)
    }
}

func cal_popu(east int, west int, north int, south int, xdim int, ydim int, array[] CensusGroup, key_chan chan int, ma_lat float64, mi_lat float64, ma_long float64, mi_long float64){
        if (len(array) > 20000){
            chn:= make(chan int)
            chn2 := make(chan int)
            mid := len(array)/2
            go cal_popu(east, west, north, south, xdim, ydim, array[:mid],chn,ma_lat,mi_lat,ma_long,mi_long)
            go cal_popu(east, west, north, south, xdim, ydim, array[mid:],chn2,ma_lat,mi_lat,ma_long,mi_long)
            population_left := <-chn
            total_left := <-chn
            population_right := <-chn2
            total_right := <-chn2
            key_chan <- population_left+population_right
            key_chan <- total_left+total_right
            } else{
                total:=0
                population := 0
                for i:=0;i<len(array);i++{
                norm_lat := normalize_lat(array[i].latitude, ma_lat,mi_lat,ydim)
                norm_long := normalize_long(array[i].longitude,ma_long,mi_long,xdim)
                if (norm_lat<=north && norm_lat>= south && norm_long>= west && norm_long<=east){
                    population = array[i].population+ population
                }
                total = total+array[i].population
            }
            key_chan <- population
            key_chan <- total
            }
}

func grid_v5(array_grid[][]int,arr[][] *sync.Mutex,array[] CensusGroup, key_chan chan int,ma_lat float64, mi_lat float64, ma_long float64,mi_long float64,ydim int, xdim int){
       if(len(array) > 10000){   
        chn := make(chan int)
        chn2:= make(chan int)
        mid:= len(array)/2
        go grid_v5(array_grid,arr,array[:mid],chn,ma_lat,mi_lat, ma_long,mi_long,ydim,xdim)
        go grid_v5(array_grid,arr,array[mid:],chn2,ma_lat,mi_lat,ma_long,mi_long,ydim,xdim)
        <-chn
        <-chn2
        } else{
            for i:=0;i<len(array);i++{
                norm_lat := normalize_lat(array[i].latitude, ma_lat,mi_lat,ydim)
                norm_long := normalize_long(array[i].longitude,ma_long,mi_long,xdim)
                arr[ydim-norm_lat][norm_long-1].Lock()
                array_grid[ydim-norm_lat][norm_long-1] += array[i].population
                arr[ydim-norm_lat][norm_long-1].Unlock()
            }
            }
            key_chan<-0
}

func make_grid(array[] CensusGroup, key_chan chan [][]int,ma_lat float64, mi_lat float64, ma_long float64,mi_long float64,ydim int, xdim int){
    if(len(array) > 10000){   
        chn := make(chan [][]int)
        chn2:= make(chan [][]int)
        mid:= len(array)/2
        go make_grid(array[:mid],chn,ma_lat,mi_lat, ma_long,mi_long,ydim,xdim)
        go make_grid(array[mid:],chn2,ma_lat,mi_lat,ma_long,mi_long,ydim,xdim)
        grid1 := <-chn
        grid2 := <-chn2
        grid3 := make([][]int, ydim)
        for i:=0;i<ydim;i++{
            grid3[i] = make([]int,xdim)
        } 
     
        for i:=0;i<ydim;i++{
            for j:=0;j<xdim;j++{
                 grid3[i][j]=grid1[i][j]+grid2[i][j]   
                }
            }

        key_chan <- grid3
        } else{

            grid := make([][]int, ydim)
                for i:=0;i<ydim;i++{
                    grid[i] = make([]int,xdim)
                } 
            for i:=0;i<len(array);i++{
                norm_lat := normalize_lat(array[i].latitude, ma_lat,mi_lat,ydim)
                norm_long := normalize_long(array[i].longitude,ma_long,mi_long,xdim)
                grid[ydim-norm_lat][norm_long-1] += array[i].population
            }
                key_chan<-grid
            }
        }


func main () {
	if len(os.Args) < 4 {
		fmt.Printf("Usage:\nArg 1: file name for input data\nArg 2: number of x-dim buckets\nArg 3: number of y-dim buckets\nArg 4: -v1, -v2, -v3, -v4, -v5, or -v6\n")
		return
	}
	fname, ver := os.Args[1], os.Args[4]
    xdim, err := strconv.Atoi(os.Args[2])
	if err != nil {
		fmt.Println(err)
		return
	}
    ydim, err := strconv.Atoi(os.Args[3])
	if err != nil {
		fmt.Println(err)
		return
	}
	censusData, err := ParseCensusData(fname)
	if err != nil {
		fmt.Println(err)
		return
	}

    // Some parts may need no setup code
        max_lat := censusData[0].latitude
        min_lat := censusData[0].latitude
        max_long := censusData[0].longitude
        min_long := censusData[0].longitude
        lat_max := 0.0
        lat_min := 0.0
        long_max := 0.0
        long_min := 0.0
        total3 := 0.0
        total4 := 0.0
        grid := make([][]int, ydim)
        lock := make([][]*sync.Mutex, ydim)
        for i:=0;i<ydim;i++{
            grid[i] = make([]int,xdim)
            lock[i] = make([]*sync.Mutex,xdim)
        } 
        for i:=0;i<ydim;i++{
            for j:=0;j<xdim;j++{
                var m sync.Mutex
                lock[i][j] = &m
            }
        }

        total1:=0

    switch ver {
    case "-v1":
        for i:=0 ; i< len(censusData); i++ {
             if (censusData[i].latitude >= max_lat){
                max_lat = censusData[i].latitude
             }
             if (censusData[i].latitude <= min_lat) {
                min_lat = censusData[i].latitude                 
             }
             if (censusData[i].longitude >= max_long) {
                max_long = censusData[i].longitude                 
             }
             if (censusData[i].longitude <= min_long) {
                min_long = censusData[i].longitude                 
             }
          }

          fmt.Println(max_long, min_long, max_lat, min_lat)
          
    case "-v2":
        ch := make(chan float64)
        go max_min_parallel(censusData,ch)
        lat_max = <-ch
        lat_min = <-ch
        long_max = <-ch
        long_min = <-ch
        fmt.Println(lat_max, lat_min, long_max, long_min)
    case "-v3":
        for i:=0 ; i< len(censusData); i++ {
             if (censusData[i].latitude >= max_lat){
                max_lat = censusData[i].latitude
             }
             if (censusData[i].latitude <= min_lat) {
                min_lat = censusData[i].latitude                 
             }
             if (censusData[i].longitude >= max_long) {
                max_long = censusData[i].longitude                 
             }
             if (censusData[i].longitude <= min_long) {
                min_long = censusData[i].longitude                 
             }
             total1 = total1+ censusData[i].population
          }
          for i:=0;i<len(censusData);i++{
                norm_lat := normalize_lat(censusData[i].latitude, max_lat,min_lat,ydim)
                norm_long := normalize_long(censusData[i].longitude,max_long,min_long,xdim)
                grid[ydim-norm_lat][norm_long-1] += censusData[i].population
            }
            for i:=0;i<ydim;i++{
                for j:=0;j<xdim;j++{
                    if(i!=0 && j!= 0){
                    temp := grid[i][j]
                    grid[i][j] = temp + grid[i-1][j]+grid[i][j-1]-grid[i-1][j-1]
                }
                    if (j==0 && i!=0){
                    temp := grid[i][j]
                    grid[i][j] = temp + grid[i-1][j]               
                }
                    if (j==0 && i==0) {
                        temp := grid[i][j]
                        grid[i][j] = temp                        
                }
                    if (i==0 && j!= 0) {
                        temp := grid[i][j]
                        grid[i][j] = temp + grid[i][j-1]                        
                }
                }
            }
    case "-v4":
        ch := make(chan float64)
        ch_step := make(chan [][]int)
        go max_min_parallel(censusData,ch)
        lat_max = <-ch
        lat_min = <-ch
        long_max = <-ch
        long_min = <-ch
        total3 = <-ch
        go make_grid(censusData,ch_step,lat_max,lat_min,long_max,long_min,ydim,xdim)
        grid = <-ch_step
            for i:=0;i<ydim;i++{
                for j:=0;j<xdim;j++{
                    if(i!=0 && j!= 0){
                    temp := grid[i][j]
                    grid[i][j] = temp + grid[i-1][j]+grid[i][j-1]-grid[i-1][j-1]
                }
                    if (j==0 && i!=0){
                    temp := grid[i][j]
                    grid[i][j] = temp + grid[i-1][j]               
                }
                    if (j==0 && i==0) {
                        temp := grid[i][j]
                        grid[i][j] = temp                        
                }
                    if (i==0 && j!= 0) {
                        temp := grid[i][j]
                        grid[i][j] = temp + grid[i][j-1]                        
                }
                }
            }

    case "-v5":
        ch := make(chan float64)
        ch_step := make(chan int)
        go max_min_parallel(censusData,ch)
        lat_max = <-ch
        lat_min = <-ch
        long_max = <-ch
        long_min = <-ch
        total4 = <-ch
        go grid_v5(grid,lock,censusData, ch_step,lat_max,lat_min,long_max,long_min,ydim, xdim)
        <-ch_step
        for i:=0;i<ydim;i++{
                for j:=0;j<xdim;j++{
                    if(i!=0 && j!= 0){
                    temp := grid[i][j]
                    grid[i][j] = temp + grid[i-1][j]+grid[i][j-1]-grid[i-1][j-1]
                }
                    if (j==0 && i!=0){
                    temp := grid[i][j]
                    grid[i][j] = temp + grid[i-1][j]               
                }
                    if (j==0 && i==0) {
                        temp := grid[i][j]
                        grid[i][j] = temp                        
                }
                    if (i==0 && j!= 0) {
                        temp := grid[i][j]
                        grid[i][j] = temp + grid[i][j-1]                        
                }
                }
            }
    case "-v6":
        // YOUR SETUP CODE FOR PART 6
    default:
        fmt.Println("Invalid version argument")
        return
    }

    for {
        var west, south, east, north int
        n, err := fmt.Scanln(&west, &south, &east, &north)
        if n != 4 || err != nil || west<1 || west>xdim || south<1 || south>ydim || east<west || east>xdim || north<south || north>ydim {
            break
        }

        var population int
        var percentage float64
        total := 0
        switch ver {
        case "-v1":
            population = 0
            for i:=0;i<len(censusData);i++{
                norm_lat := normalize_lat(censusData[i].latitude, max_lat,min_lat,ydim)
                norm_long := normalize_long(censusData[i].longitude,max_long,min_long,xdim)
                if (norm_lat<=north && norm_lat>= south && norm_long>= west && norm_long<=east){
                    population = censusData[i].population+ population
                }
               total= censusData[i].population+total
            }
            percentage = (float64(population)/float64(total))*100

        case "-v2":
            population = 0
            total = 0
            ch := make(chan int)
            go cal_popu(east, west, north, south, xdim, ydim, censusData, ch, lat_max, lat_min, long_max, long_min)
            population = <-ch
            total = <-ch
            percentage = (float64(population)/float64(total))*100

        case "-v3":
             bottom_left_row := ydim-south
             bottom_left_col := west-1
             bottom_right_row := ydim-south
             bottom_right_col := east-1
             upper_left_row := ydim-north
             upper_left_col := west-1
             upper_right_row := ydim-north
             upper_right_col := east-1
             
             result := grid[bottom_right_row][bottom_right_col]
             
             if (upper_right_row-1 <0) {
                 result = result - grid[0][upper_right_col]
             } else {
                result = result- grid[upper_right_row-1][upper_right_col]
             }
             if (bottom_left_col-1 <0) {
                result = result - grid[bottom_left_row][0]
             } else{
                result = result - grid [bottom_left_row][bottom_left_col-1]
             }
             if (upper_left_row-1 <0 && upper_left_col-1<0) {
                 result = result + grid[0][0]
             } else if (upper_left_row-1<0) {
                 result = result+ grid[0][upper_left_col-1]                 
             } else if (upper_left_col-1<0){
                 result = result+grid[upper_left_row-1][0]
             } else {
                result = result+ grid[upper_left_row-1][upper_left_col-1]
             }
             population = result
             percentage = (float64(population)/float64(total1))*100

        case "-v4":
             bottom_left_row := ydim-south
             bottom_left_col := west-1
             bottom_right_row := ydim-south
             bottom_right_col := east-1
             upper_left_row := ydim-north
             upper_left_col := west-1
             upper_right_row := ydim-north
             upper_right_col := east-1
             
             result := grid[bottom_right_row][bottom_right_col]
             
             if (upper_right_row-1 <0) {
                 result = result - grid[0][upper_right_col]
             } else {
                result = result- grid[upper_right_row-1][upper_right_col]
             }
             if (bottom_left_col-1 <0) {
                result = result - grid[bottom_left_row][0]
             } else{
                result = result - grid [bottom_left_row][bottom_left_col-1]
             }
             if (upper_left_row-1 <0 && upper_left_col-1<0) {
                 result = result + grid[0][0]
             } else if (upper_left_row-1<0) {
                 result = result+ grid[0][upper_left_col-1]                 
             } else if (upper_left_col-1<0){
                 result = result+grid[upper_left_row-1][0]
             } else {
                result = result+ grid[upper_left_row-1][upper_left_col-1]
             }
             population = result
             percentage = (float64(population)/total3)*100
        case "-v5":
             bottom_left_row := ydim-south
             bottom_left_col := west-1
             bottom_right_row := ydim-south
             bottom_right_col := east-1
             upper_left_row := ydim-north
             upper_left_col := west-1
             upper_right_row := ydim-north
             upper_right_col := east-1
             
             result := grid[bottom_right_row][bottom_right_col]
             
             if (upper_right_row-1 <0) {
                 result = result - grid[0][upper_right_col]
             } else {
                result = result- grid[upper_right_row-1][upper_right_col]
             }
             if (bottom_left_col-1 <0) {
                result = result - grid[bottom_left_row][0]
             } else{
                result = result - grid [bottom_left_row][bottom_left_col-1]
             }
             if (upper_left_row-1 <0 && upper_left_col-1<0) {
                 result = result + grid[0][0]
             } else if (upper_left_row-1<0) {
                 result = result+ grid[0][upper_left_col-1]                 
             } else if (upper_left_col-1<0){
                 result = result+grid[upper_left_row-1][0]
             } else {
                result = result+ grid[upper_left_row-1][upper_left_col-1]
             }
             population = result
             percentage = (float64(population)/total4)*100
        case "-v6":
            // YOUR QUERY CODE FOR PART 6
        }

        fmt.Printf("%v %.2f%%\n", population, percentage)
    }
}
