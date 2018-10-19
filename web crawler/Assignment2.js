const fs= require('fs')
const parse5 = require('parse5')
const http=require('http')
const https = require ('https')
const url = require('url')
const delay = msecs => new Promise(resolve => setTimeout(resolve, msecs))
conf= {}
count =0
siteInfo ={}
flag=0

function readFile(filename){
	return new Promise(function(resolve,reject){
		fs.readFile(filename,'utf-8',(err,data)=> {
			if(err){
				reject(`The file ${filename} wasnt read properly`)
			}
			else {
				resolve(data)
			}
		})

	})
}

function parse (filename){
	return readFile(filename).then(function(data){
		 return (JSON.parse(data))	
	}).catch(function(fromReject) {
		console.error(fromReject)
	})
}

parse('config.json').then(function(data){
	conf =  data
	urlfetch(conf.initialUrls)
}).catch(function(fromReject){
	console.log(fromReject)
})


//Code for getting responsess
function urlfetch (url_list){
	return new Promise (function(resolve,reject){
	if (flag==0){
	url_list.forEach(a => {
		if ((url.parse(a)).protocol == 'http:'){
			http.get(a,function(response){
           			 const parser2 = new parse5.SAXParser()
           			 response.pipe(parser2)
           			 parser2.on ('startTag', function(tag,attribute){
           			 	if (tag == 'a'){
           			 		attribute.forEach(at=>{
           			 			if(at.name=='href'){
           			 				if(at.value.startsWith('//')){
                          let string = (url.parse(a).protocol)+ at.value
                          if (flag == 0){
                          solver(string)
                          if(siteInfo[url.parse(a).hostname]!=undefined)
           			 		     {
                            if (!(siteInfo[url.parse(a).hostname].map.includes(url.parse(string).hostname)))
                            {
                              if(url.parse(a).hostname != url.parse(string).hostname){
                                siteInfo[url.parse(a).hostname].outgoing += 1
                                siteInfo[url.parse(a).hostname].map[(siteInfo[url.parse(a).hostname].outgoing)-1] = url.parse(string).hostname  
                            }
                          }
                          }

                        }
                        }

                        else if(at.value.startsWith('/')){
                          let string = a+ at.value
                          if (flag == 0){
                          solver(string)
                          if(siteInfo[url.parse(a).hostname]!=undefined)
           			 		{
                          if (!(siteInfo[url.parse(a).hostname].map.includes(url.parse(string).hostname)))
                          {
                            if(url.parse(a).hostname != url.parse(string).hostname){
                              siteInfo[url.parse(a).hostname].outgoing += 1
                              siteInfo[url.parse(a).hostname].map[(siteInfo[url.parse(a).hostname].outgoing)-1] = url.parse(string).hostname  
                          }
                        }
                            } 
                        }
                        }
                        else if (at.value.startsWith('http://'|| 'https://')) {
                          if (flag == 0){
                          solver(at.value)
                          if(siteInfo[url.parse(a).hostname]!=undefined)
           			 		     {
                            if (!(siteInfo[url.parse(a).hostname].map.includes(url.parse(string).hostname)))
                            {
                              if(url.parse(a).hostname != url.parse(at.value).hostname){ 
                               siteInfo[url.parse(a).hostname].outgoing += 1
                               siteInfo[url.parse(a).hostname].map[(siteInfo[url.parse(a).hostname].outgoing)-1] = url.parse(at.value).hostname  
                            }
                          }
                      	 }
                        }
                        }

           			 			}

           			 		})
           			 	}
           			 })
                 	 
           	}).on('error' ,err => reject(err))
		}
		else {
			https.get(a,function(response){
      	 const parser2 = new parse5.SAXParser()
           			 response.pipe(parser2)
           			 parser2.on ('startTag', function(tag,attribute){
           			 	if (tag == 'a'){
           			 		attribute.forEach(at=>{
           			 			if(at.name=='href'){
           			 				if(at.value.startsWith('//')){
           			 					let string = (url.parse(a).protocol)+ at.value
                              			 					
           			 					if (flag === 0){
           			 					solver(string)
           			 	if(siteInfo[url.parse(a).hostname]!=undefined)
           			 		{
                          if (!(siteInfo[url.parse(a).hostname].map).includes(url.parse(string).hostname))
                          {
                            if(url.parse(a).hostname != url.parse(string).hostname){
                           siteInfo[url.parse(a).hostname].outgoing += 1
                           siteInfo[url.parse(a).hostname].map[(siteInfo[url.parse(a).hostname].outgoing)-1] = url.parse(string).hostname  
                          }
                        }
                            }

           			 				}
           			 				}

           			 				else if(at.value.startsWith('/')){
           			 					let string = url.parse(a).href+ at.value
           			 					if (flag === 0){
           			 					solver(string)
           			 	   if(siteInfo[url.parse(a).hostname]!=undefined)
           			 		{
                          if (!(siteInfo[url.parse(a).hostname].map).includes(url.parse(string).hostname))
                          {
                            if(url.parse(a).hostname != url.parse(string).hostname){
                           siteInfo[url.parse(a).hostname].outgoing += 1
                           siteInfo[url.parse(a).hostname].map[(siteInfo[url.parse(a).hostname].outgoing)-1] = url.parse(string).hostname  
                          }
                          } 
           			 		}		}
           			 				}
           			 				else if ((at.value.startsWith('http://'))|| (at.value.startsWith('https://'))) {
           			 					
           			 					if (flag === 0){
           			 					solver(at.value)
           			 		if(siteInfo[url.parse(a).hostname]!=undefined)
           			 		{			
                          if (!(siteInfo[url.parse(a).hostname].map.includes(url.parse(at.value).hostname)))
                          {
                            if(url.parse(a).hostname != url.parse(at.value).hostname){
                           siteInfo[url.parse(a).hostname].outgoing += 1
                           siteInfo[url.parse(a).hostname].map[(siteInfo[url.parse(a).hostname].outgoing)-1] = url.parse(at.value).hostname  
                          }
                        }
                            }
           			 				}
           			 				}

           			 			}

           			 		})
           			 	}
           			 })
           	}).on('error' ,err => reject(err))
		}
})
}
})
}

function solver(url_3){
	if(count < conf.maxRequests) {
		let domain = url.parse(url_3).hostname
		if (siteInfo[domain]==undefined){
			siteInfo [domain]= 
			{
				requestCount: 1,
        promisedDelay: urlfetch([url_3]).then(delay(1000)).catch(()=>console.log('')),
        map : [],
        outgoing : 0,
        map_incoming:[],
        incoming : 0
			}
			count++
		}
	
	else {

		if (siteInfo[domain].requestCount < conf.maxRequestsPerSite)
		{
			siteInfo[domain].requestCount += 1
			siteInfo[domain].promisedDelay = siteInfo[domain].promisedDelay.then(urlfetch([url_3]).then(()=>delay(1000)).catch(()=>console.log(''))).catch(()=>console.log(''))
			count++
		}

	}
}
   
 else if(count == conf.maxRequests)
 {
	flag=1
  }  

 if (flag===1){
      for (var domain in siteInfo)
   {
     for (var mapping in siteInfo)
     { 
       if (siteInfo[mapping].map.includes(domain))

       {
         if (!(siteInfo[domain].map_incoming.includes(domain))){
           siteInfo[domain].incoming += 1
         siteInfo[domain].map_incoming[(siteInfo[domain].incoming)-1] = mapping
      }
      }
     }
    }
  console.log (siteInfo)
 }
}
