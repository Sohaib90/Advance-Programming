const socket = io()
const waiting = 0
var msg = ''
var symbol = ''
var box = []
var turn = 0
var value = true
var highlightedid =0

for (var i = 0 ;i<8;i++)
  	box[i] = []                   

for (var i = 0 ;i<8;i++)
{
	for(var j = 0 ;j<8;j++)
	{
		if ((i===3 && j===3)||(i===4 && j===4))
			box[i][j] = 'o '
		else if ((i===3 && j===4)||(i===4 && j===3))
			box[i][j] = 'x '
		else
			box[i][j] = '_ '
	}

}
 
socket.on('my_message',function(data,symbol){
	turn = !data
	ReactDOM.render(React.createElement('div',null,`GAME IS WON BY ${symbol}`,
			React.createElement('div',null,box.map(bx=>React.createElement('div',null,bx.map(b=>React.createElement('div',{
				style: {display:'inline'},
			},React.createElement('font',
				{size:'10'}
			    ,b))))))),
			document.getElementById('root'))
	
	console.log(`The turn is after board is filled ${turn}`)
})


socket.on('message', function(data) {
     render()
})

socket.on('symbol', function(data){
	symbol = data
	console.log(symbol)

})

socket.on('turn', function(data){
	turn = data
	console.log(turn)
})

function valid_move(event){
	event.preventDefault()
	socket.emit('ID',event.target.id,box)
}

function highlight(data){
	
	highlightedid = data

	if (value != false)
	{
		 var id_box= -1
			ReactDOM.render(
			React.createElement('div',null,box.map(bx=>React.createElement('div',null,bx.map(b=>
			{    
				++id_box
			if(id_box == highlightedid) {
				return React.createElement('div',{style: {display:'inline'}},React.createElement('font',{size:'10'},React.createElement('mark',{
			    	onClick:valid_move,
			    	onMouseOver:valid_move2,
			    	id:id_box,
			    },b)))}

			else if (id_box != highlightedid && (highlightedid >=0 && highlightedid <=63)){
				return React.createElement('div',{
				style: {display:'inline'}},React.createElement('font',{size:'10',id: id_box,onClick: valid_move,onMouseOver: valid_move2},b))
				}})))),
			document.getElementById('root'))
       
    }

	else
	{
		render()
	}
}

socket.on('valid_resp',function(data)
{
	console.log(data)
	box = data
	turn = !turn
	console.log(`The ne turn is ${turn}`)
	render()
})

socket.on('invalid_resp',function(data)
{
	console.log(data)
	box = data
	console.log(`The ne turn is ${turn}`)
	render()
})


function alert_move () {
	alert('Not your turn')
}

function render () {

		if (turn === true)
	{
		 var id_box= -1
		ReactDOM.render(
			React.createElement('div',null,box.map(bx=>React.createElement('div',null,bx.map(b=>React.createElement('div',{
				style: {display:'inline'},
			},React.createElement('font',
				{size:'10',
				id: ++id_box,
			    onClick: valid_move,
			    onMouseOver: valid_move2},b)))))),
			document.getElementById('root'))
	}

	 else if (turn === false)
	 {
	 	 var id_box= -1
	 	ReactDOM.render(
	 		React.createElement('div',null,box.map(bx=>React.createElement('div',null,bx.map(b=>React.createElement('div',{
	 			style: {display:'inline'},
	 		},React.createElement('font',
	 			{size:'10',
	 			id: ++id_box},b)))))),
	 		document.getElementById('root'))
	 }
}

function valid_move2 (event){
	event.preventDefault()
	let id_move = event.target.id
	let row = Math.floor(id_move/8)
	let col = id_move%8

if(box[row][col]=='_ ')
{
	// up
	if (row >=1)
  {
	if (box[row-1][col] !== symbol && box[row-1][col] !== '_ ' )
	{ 

		var temp_row = row-1
		while (temp_row >= 0)
		{
			if (box[temp_row][col]=== '_ ')
				break
			else if (box[temp_row][col] === symbol)
			{
				highlight(id_move)
				return 
			}
	    	--temp_row
		}
	 }
  }
}

if(box[row][col] =='_ ')
{
	//down
	if(row <7)
	{
	if (box[row+1][col] !== symbol && box[row+1][col] !== '_ ')
	{
		var temp_row= row+1
		while (temp_row < 8)
	  {
		if (box[temp_row][col] === '_ ')
			break
		else if (box[temp_row][col] === symbol)
		{
			highlight(id_move)
				return 
		}
		++temp_row
	  }
	}
  }
}

if(box[row][col]=='_ ')
{
	//left
	if(col>=1)
	{
	if (box[row][col-1] !== symbol && box[row][col-1] !== '_ ')
	{
		var temp_col = col-1
		while (temp_col >=0)
		{
			if (box[row][temp_col] === '_ ')
				break
			else if (box[row][temp_col] === symbol)
			{
				highlight(id_move)
				return 
			}
			--temp_col
		}
   	}
  }
}

if(box[row][col]== '_ ')
{
	//right
	if(col<7)
	{
	if (box[row][col+1] !== symbol && box[row][col+1] !== '_ ')
	{
		var temp_col = col+1
		while (temp_col < 8)
		{
			if (box[row][temp_col] === '_ ')
				break
			else if (box[row][temp_col] === symbol)
			{
				highlight(id_move)
				return 
			}
			++temp_col
		}
	}
  }
}
if(box[row][col]=='_ ')
{
  //down left
  if(row<7 && col>=1)
  {
  	if (box[row+1][col-1] !== symbol && box[row+1][col-1] !== '_ ')
  	{
		var temp_row = row+1
  		var temp_col = col-1
  		while (temp_row <8 && temp_col >= 0)
  		{
  			if(box[temp_row][temp_col] === '_ ')
  				break
  			else if (box[temp_row][temp_col]=== symbol)
  			{
  				highlight(id_move)
				return 
  	     	}
  			++temp_row
  			--temp_col
  		}
  	}
  }
}

if(box[row][col]=='_ ')
{
  //up left
  if(row>=1 && col>=1)
  {
  	if (box[row-1][col-1] !== symbol && box[row-1][col-1] !== '_ ')
  	{
  		var temp_row = row-1
  		var temp_col = col-1
  		while (temp_row >=0 && temp_col >= 0)
  		{
  			if(box[temp_row][temp_col] === '_ ')
  				break
  			else if (box[temp_row][temp_col]=== symbol)
  			{
  				highlight(id_move)
				return 
  			}
  			--temp_row
  			--temp_col
  		}
  	}
  }
}

if (box[row][col]=='_ ')
{
  //down right 
  if(row<7 && col<7)
  {
  	if (box[row+1][col+1] !== symbol && box[row+1][col+1] !== '_ ')
  	{
  		var temp_row = row+1
  		var temp_col = col+1
  		while (temp_row < 8 && temp_col < 8)
  		{
  			if(box[temp_row][temp_col] === '_ ')
  				break
  			else if (box[temp_row][temp_col]=== symbol)
  			{
  				highlight(id_move)
				return 
  			}
  			++temp_row
  			++temp_col
  		}
  	}
  }
}

  if (box[row][col]=='_ ')
  {
  if(row>=1 && col<7)
  {
  	if (box[row-1][col+1] !== symbol && box[row-1][col+1] !== '_ ')
  	{
  		var temp_row = row-1
  		var temp_col = col+1
  		while (temp_row >=0 && temp_col < 8)
  		{
  			if(box[temp_row][temp_col] === '_ ')
  				break
  			else if (box[temp_row][temp_col]=== symbol)
  			{
  				highlight(id_move)
				return 
  			}
  			--temp_row
  			++temp_col
  		}
  	}
  }
}

	return false
}