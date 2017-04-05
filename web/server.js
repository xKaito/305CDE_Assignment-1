var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');
var qs = require('querystring');
var mimeTypes = {
           "html": "text/html",
           "jpeg": "image/jpeg",
           "jpg": "image/jpeg",
           "png": "image/png",
           "js": "text/javascript",
           "css": "text/css"};

var mongojs = require('mongojs');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var dbUrl = 'mongodb://localhost:27017/my_database_name';
var mongodbServer = new mongodb.Server('THISserver', 27017, {auto_reconnect: true, poolSize: 10});
var db = new mongodb.Db('THISdb', mongodbServer);
var collection = db.collection('users');

//to check if login is success or fail
var loginSuc = false;
var loginFail = false;

//send success message or fail message after checking the login information
var sendSuc = false;
var sendFail = false;

//to check if logout is success and sending the logout message
var logoutSuc = false;
var sendLogout = false;

//to check if register is success or not
var regSuc = false;
var regFailu = false;	//username used
var regFaile = false;	//email used

//username of current user
var curUser = "no one";
var picNum;


//user's favourite list
var userList1 = "";
var userList2 = "";
var userList3 = "";
var addHere = "";

var bridge = -1;

var server = http.createServer(function onRequest(request, response) {
			var urlParts = url.parse(request.url);
			var fullPath = urlParts.pathname;
       //var page = 'pages' + urlParts.pathname;
      var page = './' + urlParts.pathname;
      //console.log(fullPath);
      //console.log(page);
       
       var jsonUserOject = '';
  
       //
        var action, form, formData, msg, publicPath, urlData;
        urlData = url.parse(request.url, true);
        action = urlData.pathname;
        publicPath = __dirname + "\\public\\";
	      //console.log(request.url);
        
  
        if (request.method === "POST") {
          formData = '';
           msg = '';
            return request.on('data', function(data) {
              formData += data;
                return request.on('end', function() {
                  var obj, user;
                  user = qs.parse(formData);
									msg = JSON.stringify(user);
									obj = JSON.parse(msg);

                  var type = obj.type;
									
									if (type == "login") {
										console.log("There is a login request");
										var username = obj.username;
										var password = obj.password;
										
										MongoClient.connect(dbUrl, function (err, db) {
												if (err) {
													console.log('Unable to connect to the mongoDB server. Error:', err);
												} else {
												//Successfully connected to database
												//console.log('Connection established to', url);
										
												db.collection('user', function (err, collection) {
														collection.find().toArray(function(err, items) {
																if(err) throw err;
																if (items !== "") {
																	//find the requied user in database
																	for (var i=0; i<items.length; i++) {
																		if (username === items[i].username && password === items[i].password) {
																			loginSuc = true;
																			sendSuc = true;
																			console.log("The user " + username + " login with password " + password + ".");
																			curUser = username;
																			picNum = items[i].picCount;
																			console.log("Current user = " + curUser);
																			console.log("picCount = " + picNum);
																			userList1 = items[i].favourite1;
																			userList2 = items[i].favourite2;
																			userList3 = items[i].favourite3;
																			
																			console.log(userList1);
																			console.log(userList2);
																			console.log(userList3);
																			bridge = items[i].picCount;
																		} else {
																			loginFail = true;
																			sendFail = true;
																			console.log("Login Fail");
																		}
																	}
																}
																console.log(items);
														});
												});
												
												//Close connection
												db.close();
												}
										});
										
									} else if (type == "register") {
										console.log("The is a register request.");
										var rusername = obj.username;
										var remail = obj.email;
										var rpassword = obj.cpassword;
										console.log("The user " + rusername + " registered with password " + rpassword + " and email " + remail + ".");
										
											MongoClient.connect(dbUrl, function (err, db) {
												if (err) {
													console.log('Unable to connect to the mongoDB server. Error:', err);
												} else {
													//Successfully connected to database
													//console.log('Connection established to', url);
													
													var userToAdd = {
														username: rusername, 
														email: remail,
														password: rpassword,
														picCount: 0,
														favourite1: [],
														favourite2: [],
														favourite3: []
													};
													
													
													var canAdd = false;
													console.log("canAdd = " + canAdd);
													
													db.collection('user', function (err, collection) {
														collection.find().toArray(function(err, items) {
																	console.log("Checking with the database for register data...");
																	if(err) throw err;
																	//check whether the username and email has been used for register before
																	for (var i=0; i<items.length; i++) {
																		if (rusername == items[i].username) {
																			regFailu = true;
																			console.log("Registration fail: username " + rusername + " has been used for registration.");
																		} else if (remail == items[i].email) {
																			regFaile = true;
																			console.log("Registration fail: e-mail " + remail + " has been used for registration.");
																		} else {
																			canAdd = true;
																			console.log("After checking, canAdd = " + canAdd);
																		}
																	}
																	console.log(items);            
														});
													});
													
													if (canAdd){
														db.collection('user', function (err, collection) {
															collection.insert([userToAdd], function (err, result) {
																if (err) {
																	console.log(err);
																} else {
																	regSuc = true;
																	console.log('Insert Successful');
																}
															});
															
															//collection.remove();

															collection.find().toArray(function(err, items) {
																	if(err) throw err;    
																	console.log(items);            
															});
														});
													}
													

													//Close connection
													db.close();
												}
											});
										
									} else if (type == "logout") {
										console.log("The is a logout request.");
										
										loginSuc = false;
										logoutSuc = true;
										sendLogout = true;
										curUser = "no one";
										console.log("Current user = " + curUser);
										
									} else if (type == "fav") {
										console.log("The is a add to favourite request.");
										var fpic = obj.pic;
										var fdate = obj.date;
										
											MongoClient.connect(dbUrl, function (err, db) {
												if (err) {
													console.log('Unable to connect to the mongoDB server. Error:', err);
												} else {
													//Successfully connected to database
													//console.log('Connection established to', url);
													
													var photoToAdd = {
														pic: fpic, 
														date: fdate
													};
													
													
													
														db.collection('user', function (err, collection) {
															
															collection.find({username: curUser}).toArray(function(err, items) {
																		if(err) throw err;
																		if (items !== "") {
																			//find the requied user in database
																			for (var i=0; i<items.length; i++) {
																				if (curUser === items[i].username) {
																					if (items[i].picCount === 0){
																						bridge = 0;
																					} else if (items[i].picCount === 1){
																						bridge = 1;
																					} else if (items[i].picCount === 2){
																						bridge = 2;
																					} console.log("bridge1 = " + bridge);
																				}
																			}
																		}
															});
															
															console.log("bridge2 = " + bridge);
															
															
															if (bridge === 0) {
																collection.update({username: curUser}, {$set: {favourite1: photoToAdd, picCount: 1}}, function (err, items) {
																	if (err) {
																		console.log(err);
																	} else {
																		console.log('Update Successful');
																	}
																});
															} else if (bridge === 1) {
																collection.update({username: curUser}, {$set: {favourite2: photoToAdd, picCount: 2}}, function (err, items) {
																	if (err) {
																		console.log(err);
																	} else {
																		console.log('Update Successful');
																	}
																});
															} else if (bridge === 2) {
																collection.update({username: curUser}, {$set: {favourite3: photoToAdd}}, function (err, items) {
																	if (err) {
																		console.log(err);
																	} else {
																		console.log('Update Successful');
																	}
																});
															}
															
															

															
															//collection.remove();

															collection.find().toArray(function(err, items) {
																	if(err) throw err;    
																	console.log(items);
																	if (items !== "") {
																			//find the requied user in database
																			for (var i=0; i<items.length; i++) {
																				if (curUser === items[i].username) {
																					userList1 = items[i].favourite1;
																					userList2 = items[i].favourite2;
																					userList3 = items[i].favourite3;
																				}
																			}
																	}
															});
															
															
														});

													//Close connection
													db.close();
												}
											});
										
									}
									
                  response.writeHead(200, {
                    "Content-Type": "application/json",
                    "Content-Length": msg.length
                  });
                    return response.end(msg);
                });
            });
        }
  
    var mimeType = mimeTypes[path.extname(page).split(".")[1]];
    fs.exists(page, function fileExists(exists) {
              if (exists) {
                   response.writeHead(200, mimeType);
                   fs.createReadStream(page).pipe(response);
              } else if (request.url == '/home'){
                 form = "home.html";
                  fs.readFile(form, function(err, contents) {
                    if (err !== true) {
                      response.writeHead(200, {
                        "Content-Type": "text/html"
                      });
                      response.end(contents);
                    } else {
                      response.writeHead(500);
                      response.end('_testcb(\'{"message": "Hello world 444!"}\')');
                      //return response.end;
                    }
                  });
              } else if (request.url == '/user' && loginSuc === false){
                 form = "user.html";
                  fs.readFile(form, function(err, contents) {
                    if (err !== true) {
                      response.writeHead(200, {
                        "Content-Type": "text/html"
                      });
                      response.end(contents);
                    } else {
                      response.writeHead(500);
                      response.end('_testcb(\'{"message": "Hello world 444!"}\')');
                      //return response.end;
                    }
                  });
              } else if (request.url == '/user?'){
                  form = "home.html";
                  fs.readFile(form, function(err, contents) {
                    if (err !== true) {
                      response.writeHead(200, {
                        "Content-Type": "text/html"
                      });
                      response.end(contents);
                    } else {
                      response.writeHead(500);
                      response.end('_testcb(\'{"message": "Hello world 444!"}\')');
                      //return response.end;
                    }
                  });
              } else if (request.url == '/user' && loginSuc === true){
                  form = "userL.html";
                  fs.readFile(form, function(err, contents) {
                    if (err !== true) {
                      response.writeHead(200, {
                        "Content-Type": "text/html"
                      });
                      response.end(contents);
                    } else {
                      response.writeHead(500);
                      response.end('_testcb(\'{"message": "Hello world 444!"}\')');
                      //return response.end;
                    }
                  });
              } else if (request.url == '/gallery'){
                 form = "gallery.html";
                  fs.readFile(form, function(err, contents) {
                    if (err !== true) {
                      response.writeHead(200, {
                        "Content-Type": "text/html"
                      });
                      response.end(contents);
                    } else {
                      response.writeHead(500);
                      response.end('_testcb(\'{"message": "Hello world 444!"}\')');
                      //return response.end;
                    }
                  });
              } else if (request.url == '/contact'){
                 form = "contact.html";
                  fs.readFile(form, function(err, contents) {
                    if (err !== true) {
                      response.writeHead(200, {
                        "Content-Type": "text/html"
                      });
                      response.end(contents);
                    } else {
                      response.writeHead(500);
                      response.end('_testcb(\'{"message": "Hello world 444!"}\')');
                      //return response.end;
                    }
                  });
              } else {
                   response.write('Page Not Found');
                   response.end();
              }
    });
}).listen(1234);

console.log("Server is running at http://305cde_assignment-zx007890850409.codeanyapp.com:1234/home, the time now is " + new Date());

//testing from server to html
// IO is used to send message between server an client
var io = require("socket.io").listen(server);



	
function sendMsg() {
	var list1 = "";
	var list2 = "";
	var list3 = "";
	list1 = userList1;
	list2 = userList2;
	list3 = userList3;
	//send message when login is successful
	if (loginSuc === true) {
		if (sendSuc) {
			console.log("Sending login successful message to html");
			io.emit("can_login", { message: "Login Successful!" });
			sendSuc = false;
		}
	io.emit("favList1", userList1);
	io.emit("favList2", userList2);
	io.emit("favList3", userList3);
	console.log( "favList1" );
	console.log( list1 );
	console.log( "favList2" );
	console.log( list2 );
	console.log( "favList3" );
	console.log( list3 );
	}
	
	//send message when login is fail
	if (loginFail === true) {
		if(sendFail) {
			console.log("Sending login fail message to html");
			io.emit("cant_login", { message: "Login Failed!" });
			loginFail = false;
			sendFail = false;
		}
	}
	
	//send message when logout is successful
	if (logoutSuc === true) {
		if(sendLogout) {
			console.log("Sending logout message to html");
			io.emit("can_logout", { message: "Logout Successful!" });
			loginSuc = false;
			logoutSuc = false;
			sendLogout = false;
		}
	}
	
	//send message when register is seccessful
	if (regSuc === true) {
		console.log("Sending register success message to html");
		io.emit("can_register", { message: "Register Successful!" });
		regSuc = false;
	}
	
	//send message when register is fail (username used)
	if (regFailu === true) {
		console.log("Sending register fail message to html (username used)");
		io.emit("cant_register", { message: "Username has been used!" });
		regFailu = false;
	}
	
	//send message when register is fail (email used)
	if (regFaile === true) {
		console.log("Sending register fail message to html (email used)");
		io.emit("cant_register", { message: "e-mail has been used!" });
		regFaile = false;
	}
	
	//show the favourite photo gallery of the user
	if (curUser != "no one") {
		io.emit("curUser", { message: curUser });
	}
	
	//show the favourite photo gallery of the user
	if (curUser === "no one") {
		io.emit("noUser", { message: "no one" });
	}
	
	
	
}
	
setInterval(sendMsg, 3000);
//5000 = 5 sec