(function(){
	
	Parse.initialize("v0FUxzpUqIsbMtps1yp6GdzDwESerrqYdYRaoqWV", "HPSW6U6hTTLVJSgYWej8yJX0bDcK9xdM4jl89u0h");
	
    var templates = {};
    ['loginView', 'evaluationView', 'updateSuccessView'].forEach(function(e){
      var tpl = document.getElementById(e).text;
      templates[e] = doT.template(tpl);
    });
	
	var handler={
		navbar:function(){
			var currentUser=Parse.User.current();
			if(currentUser){
		        document.getElementById('loginButton').style.display = 'none';
		        document.getElementById('logoutButton').style.display = 'block';
				document.getElementById('evaluationButton').style.display = 'block';			
		    }
		    else{
		        document.getElementById('loginButton').style.display = 'block';
		        document.getElementById('logoutButton').style.display = 'none';
				document.getElementById('evaluationButton').style.display = 'none';
		    }
	        document.getElementById('logoutButton').addEventListener('click', function(){
	          Parse.User.logOut();
	          handlers.navbar();
	          window.location.hash = 'login/';
	        });
	    },
		loginView:function(redirect){
	        
	        //layout??
			var postAction = function(){
	          	handlers.navbar();
	          	window.location.hash = (redirect) ? redirect : '';
	        }
      
                document.getElementById("content").innerHTML = templates.loginView();
			
			
			//login binding
				document.getElememtById('form-signin-student-id').addEventListener('keyup',function(){
					var message = TAHelp.getMemberlistOf(this.value)?'':'The student is not one of the class students.';
					document.getElementById('form-signin-message').innerHTML = message;
					document.getElementById('form-signin-message').style.display = (message==''?'none':'block'); 
				});			
			//signup binding		
				document.getElememtById('form-signup-student-id').addEventListener('keyup',function(){
					var message = TAHelp.getMemberlistOf(this.value)?'':'The student is not one of the class students.';
					document.getElementById('form-signup-message').innerHTML = message;
					document.getElementById('form-signup-message').style.display = (message==''?'none':'block'); 
				});
			//signup password binding
	      	  document.getElementById('form-signup-password1').addEventListener('keyup', function(){
	       	  	var singupForm_password = document.getElementById('singup-form-password');
	          	var message = (this.value !== singupForm_password.value) ? 'Passwords don\'t match.' : '';
	          	document.getElementById('form-signup-message').innerHTML = message;
				document.getElementById('form-signup-message').style.display = (message==''?'none':'block');            
	        	});
			//login submit binding
	        	document.getElementById('content').innerHTML = templates.loginVew();
	        	document.getElementById('form-signin').addEventListener('submit', function(){
	          	  Parse.User.logIn(document.getElementById('form-signin-username').value,
	              	document.getElementById('form-signin-password').value, {
	            		success: function(user) {
	              		  postAction();
	            	  },
	            	  error: function(user, error) {
            
	         		 }
	          		}); 
	        	});				
	        //signup submit binding
	        	document.getElementById('form-signup').addEventListener('submit', function(){
	          	  var singupForm_password = document.getElementById('form-signup-password');
	          	  var singupForm_password1 = document.getElementById('form-signup-password1');
	         	  if(singupForm_password.value !== singupForm_password1.value){
	            	  document.getElementById('form-signup-message').innerHTML = 'Passwords don\'t match.';   
					  document.getElementById('form-signup-message').style.display = (message==''?'none':'block');    
	            	  return false; 
	          	  }
          
	          		var user = new Parse.User();
	         	    user.set("username", document.getElementById('form-signup-username').value);
	          	    user.set("password", document.getElementById('form-signup-password').value);
	          	    user.set("email", document.getElementById('form-signup-email').value);
 
	          	  	user.signUp(null, {
	            		success: function(user) {
	              		  postAction();
	            	    },
	            		error: function(user, error) {
	              		  document.getElementById('form-signup-message').innerHTML = 'Invaild username or password.';
						  document.getElementById('form-signup-message').style.display = (message==''?'none':'block');
	            	    }
	          	  });
	        	}, false);
			
		},
		evaluationView:function(){
			var currentUser= Parse.User.current();
			var Evaluation =Parse.Object.extend("Evaluation");
			var query = new Parse.Query(Evaluation);
	        var evaluationACL = new Parse.ACL();
	        evaluationACL.setPublicReadAccess(false);
	        evaluationACL.setPublicWriteAccess(false);
	        evaluationACL.setReadAccess(currentUser, true);
	        evaluationACL.setWriteAccess(currentUser, true);
			query.equalTo('user',currentUser);
			query.find({
				success:function(evaluation){
					window.EVAL = evaluation;
					if(evaluation === undefined){
					   var TeamMembers = TAHelp.getMemberlistOf(currentUser.get('username')).filter(function(e){
					                    return (e.StudentId !== currentUser.get('username')); 
		                          }).map(function(e){
					              e.scores = ['0', '0', '0', '0'];
					              return e;
					            });
					} 
				    else {
					   var TeamMembers = evaluation.toJSON().evaluations;
					}
		            document.getElementById('content').innerHTML = templates.evaluationView(TeamMembers);
		            document.getElementById('evaluationForm-submit').value = ( evaluation === undefined ) ? '送出表單' :'修改表單';
		            document.getElementById('evaluationForm').addEventListener('submit', function(){
		              for(var i = 0; i < TeamMembers.length; i++){
		                for(var j = 0; j < TeamMembers[i].scores.length; j++){
		                  var e = document.getElementById('stu'+TeamMembers[i].StudentId+'-q'+j);
		                  var amount = e.options[e.selectedIndex].value;
		                  TeamMembers[i].scores[j] = amount;
		                }
		              }
		              if( evaluation === undefined ){
		                evaluation = new Evaluation();
		                evaluation.set('user', currentUser);
		                evaluation.setACL(evaluationACL);
		              }
		              evaluation.set('evaluations', TeamMembers);
		              evaluation.save(null, {
		                success: function(){
		                  document.getElementById('content').innerHTML = templates.updateSuccessView();
		                },
		                error: function(){},
		              });

		            }, false);					
				},
				error:function(object,err){
				}
			});
		
		}
		//router related
		var router = Parse.Router({
			routes:{
		    '':'index',
		    'peer-evaluation': 'evaluation'
			'login/*redirect':'login'
			},
			index:handler.evaluationView,
			evaluation:handler.evaluationView,
			login:handler.loginView
		});
	    this.Router = new router();
	    Parse.history.start();
	    handler.navbar();
	    

})();
