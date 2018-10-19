const http = require ('http')
const socketio = require ('socket.io')
const fs = require('fs')
const waiting = []
var room = 0
var countx = 0
var counto = 0
var count = 0


const readFile = file =>
		new Promise((resolve, reject) =>
			fs.readFile(file, (err,data)=>
			 err ? reject(err) : resolve(data)))


const server = http.createServer((request,response) => {
		readFile(request.url.substr(1)).then(function(data){
			response.end(data)
		}).catch(function(fromReject){
			response.end()
		})
})

function filled_box (box)
{

	for (var i = 0 ;i<8;i++)
	{
		for(var j = 0 ;j<8;j++)
		{
			if (box[i][j] === '_ ')
				return false
			else if (box[i][j]==='x ')
				++countx
			else if (box[i][j]==='o ')
				++counto
		}
	}
	return true;
}


function valid_move (data,box,socket){
	let id_move = data
	let row = Math.floor(id_move/8)
	let col = id_move%8
	let flag = 0

	// up
	if (row >=1)
  {
	if (box[row-1][col] !== socket.symbol && box[row-1][col] !== '_ ' )
	{ 

		var temp_row = row-1
		while (temp_row >= 0)
		{
			if (box[temp_row][col]=== '_ ')
				break
			else if (box[temp_row][col] === socket.symbol)
			{
				var temp= temp_row
				while(temp <= row)
				{
					box[temp][col] = socket.symbol
					++temp
				}
				flag = 1
			}
	    	--temp_row
		}
	 }
  }

	//down
	if(row <7)
	{
	if (box[row+1][col] !== socket.symbol && box[row+1][col] !== '_ ')
	{
		var temp_row= row+1
		while (temp_row < 8)
	  {
		if (box[temp_row][col] === '_ ')
			break
		else if (box[temp_row][col] === socket.symbol)
		{
			var temp = temp_row
			while (temp >= row)
			{
				box[temp][col] = socket.symbol
				--temp
			}
			flag = 1
		}
		++temp_row
	  }
	}
  }

	//left
	if(col>=1)
	{
	if (box[row][col-1] !== socket.symbol && box[row][col-1] !== '_ ')
	{
		var temp_col = col-1
		while (temp_col >=0)
		{
			if (box[row][temp_col] === '_ ')
				break
			else if (box[row][temp_col] === socket.symbol)
			{
				var temp = temp_col
				while (temp <= col)
				{
					box[row][temp] = socket.symbol
					++temp
				}
				flag = 1
			}
			--temp_col
		}
   	}
  }

	//right
	if(col<7)
	{
	if (box[row][col+1] !== socket.symbol && box[row][col+1] !== '_ ')
	{
		var temp_col = col+1
		while (temp_col < 8)
		{
			if (box[row][temp_col] === '_ ')
				break
			else if (box[row][temp_col] === socket.symbol)
			{
				var temp = temp_col
				while (temp >= col)
				{
					box[row][temp] = socket.symbol
					--temp
				}
				flag =1
			}
			++temp_col
		}
	}
  }

  //down left
  if(row<7 && col>=1)
  {
  	if (box[row+1][col-1] !== socket.symbol && box[row+1][col-1] !== '_ ')
  	{	
  		var temp_row = row+1
  		var temp_col = col-1
  		while (temp_row <8 && temp_col >= 0)
  		{
  			
  			if(box[temp_row][temp_col] === '_ ')
  				break
  			else if (box[temp_row][temp_col]=== socket.symbol)
  			{
  				var temp1 = temp_row
  				var temp2 = temp_col
  				while (temp1 >= row && temp2 <= col)
  				{
  					box[temp1][temp2] = socket.symbol
  					--temp1
  					++temp2
  				}
  				flag =1
  					
  			}
  			++temp_row
  			--temp_col
  			
  		}
  	}
 }

  //up left
  if(row>=1 && col>=1)
  {
  	if (box[row-1][col-1] !== socket.symbol && box[row-1][col-1] !== '_ ') {
  	{
  		var temp_row = row-1
  		var temp_col = col-1
  		while (temp_row >=0 && temp_col >= 0)
  		{
  			if(box[temp_row][temp_col] === '_ ')
  				break
  			else if (box[temp_row][temp_col]=== socket.symbol)
  			{
  				var temp1 = temp_row
  				var temp2 = temp_col
  				while (temp1 <= row && temp2 <=col)
  				{
  					box[temp1][temp2] = socket.symbol
  					++temp1
  					++temp2
  				}
  				flag =1
  			}
  			--temp_row
  			--temp_col
  		}
  	}
  }
}

  //down right 
  if(row<7 && col<7)
  {
  	if (box[row+1][col+1] !== socket.symbol && box[row+1][col+1] !== '_ ')
  	{
  		var temp_row = row+1
  		var temp_col = col+1
  		while (temp_row < 8 && temp_col < 8)
  		{
  			if(box[temp_row][temp_col] === '_ ')
  				break
  			else if (box[temp_row][temp_col]=== socket.symbol)
  			{
  				var temp1 = temp_row
  				var temp2 = temp_col
  				while (temp1 >= row && temp2 >=col)
  				{
  					box[temp1][temp2] = socket.symbol
  					--temp1
  					--temp2
  				}
  				flag =1
  			}
  			++temp_row
  			++temp_col
  		}
  	}
  }

  if(row>=1 && col<7)
  {
  	if (box[row-1][col+1] !== socket.symbol && box[row-1][col+1] !== '_ ')
  	{
  		var temp_row = row-1
  		var temp_col = col+1
  		while (temp_row >=0 && temp_col < 8)
  		{
  			if(box[temp_row][temp_col] === '_ ')
  				break
  			else if (box[temp_row][temp_col]=== socket.symbol)
  			{
  				var temp1 = temp_row
  				var temp2 = temp_col
  				while (temp1 <= row && temp2 >= col)
  				{
  					box[temp1][temp2] = socket.symbol
  					++temp1
  					--temp2
  				}
  				flag =1
  			}
  			--temp_row
  			++temp_col
  		}
  	}
  }

	if(flag === 1)
	{
		return box
	}

	return null
}

const io = socketio(server)

io.sockets.on('connection', function(socket){
	waiting.push(socket)
	if (waiting.length%2 === 0)
	{
		    const socket1 =waiting.pop()
		    const socket2 =waiting.pop()
			socket1.join(room)
			socket2.join(room)
			socket1.turn = true
			socket1.symbol = 'x '
			socket2.turn = false
			socket2.symbol = 'o '
			socket1.room = room
			socket1.emit('turn', socket1.turn)
			socket2.emit('turn', socket2.turn)
			socket1.emit('symbol', socket1.symbol)
			socket2.emit('symbol', socket2.symbol)
		    io.sockets.in(room).emit('message', `Your Game room has been created.`)
			++room

			socket1.on('ID',function(data,box)
		  {
			let resp = valid_move(data,box,socket1)
			let end = filled_box(box)
			if(end ===true)
			{
				let result = Math.max(countx,counto)
				var symbol = result==countx ? 'x ' : 'o ' 
				io.sockets.in(socket1.room).emit('my_message',end,symbol)
			}
			if (resp !== null)
			{
				io.sockets.in(socket1.room).emit('valid_resp',resp)
		    }
		  })

			socket2.on('ID',function(data,box)
		{
			let resp = valid_move(data,box,socket2)
			let end = filled_box(resp)
			if(end === true)
			{
				let result= Math.max(countx,counto)
				var symbol = result==countx ? 'x ' : 'o '
				io.sockets.in(socket1.room).emit('my_message',end,symbol)
			}
			if (resp !== null)
			{
				io.sockets.in(socket1.room).emit('valid_resp',resp)
			}
		})
	}
})
	
server.listen(process.argv[2])