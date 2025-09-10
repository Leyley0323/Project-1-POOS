// Base URL where all PHP API files are located
const urlBase = 'http://cop4331-group2.me/LAMPAPI';
const extension = 'php';

// Global variables to store current user session data
let userId = 0;
let firstName = "";
let lastName = "";

// LOGIN FUNCTION - connects to Login.php
function doLogin()
{
	// Reset user data at start of login attempt
	userId = 0;
	firstName = "";
	lastName = "";
	
	// Get username and password from HTML form inputs
	let login = document.getElementById("loginName").value;
	let password = document.getElementById("loginPassword").value;

//	var hash = md5( password );  // Password hashing is commented out

	
	// Clear any previous error messages
	document.getElementById("loginResult").innerHTML = "";

	// Create JSON object to send to PHP script
	// This matches the format Login.php expects: {"login":"username","password":"pass"}
	let tmp = {login:login,password:password};

//	var tmp = {login:login,password:hash};  // Alternative with hashed password
	let jsonPayload = JSON.stringify( tmp );  // Convert to JSON string

	
	// Build URL to Login.php: http://cop4331-group2.me/LAMPAPI/Login.php
	let url = urlBase + '/Login.' + extension;

	// Create AJAX request to communicate with Login.php
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);  // POST request to send data securely
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try
	{
		// Define what happens when we get a response from Login.php
		xhr.onreadystatechange = function() 
		{
			// Check if request completed successfully (status 200 = OK)
			if (this.readyState == 4 && this.status == 200) 
			{
				// Parse the JSON response from Login.php
				// Login.php returns: {"id":123,"firstName":"John","lastName":"Doe","error":""}
				let jsonObject = JSON.parse( xhr.responseText );
				userId = jsonObject.id;
		
				// If userId is 0 or negative, login failed
				if( userId < 1 )
				{		
					// Show error message (Login.php sent error in response)
					document.getElementById("loginResult").innerHTML = "User/Password combination incorrect";
					return;
				}
		
				// Login successful - store user data from PHP response
				firstName = jsonObject.firstName;
				lastName = jsonObject.lastName;

				// Save user info in browser cookie for session persistence
				saveCookie();
	
				// Redirect to main application page
			
				window.location.href = "contacts.html";

			}
		};
		// Send the JSON data to Login.php
		xhr.send(jsonPayload);
	}
	catch(err)
	{
		// Display any JavaScript errors
		document.getElementById("loginResult").innerHTML = err.message;
	}
}

// COOKIE MANAGEMENT - saves user session data in browser
function saveCookie()
{
	let minutes = 20;  // Session expires in 20 minutes
	let date = new Date();
	date.setTime(date.getTime()+(minutes*60*1000));	// Calculate expiration time
	
	// Store user data as comma-separated values in cookie
	document.cookie = "firstName=" + firstName + ",lastName=" + lastName + ",userId=" + userId + ";expires=" + date.toGMTString();
}

// READ COOKIE - retrieves saved user session on page load
function readCookie()
{
	userId = -1;  // Default to -1 (not logged in)
	let data = document.cookie;  // Get all cookies
	let splits = data.split(",");  // Split by commas (our delimiter)
	
	// Parse each part of the cookie
	for(var i = 0; i < splits.length; i++) 
	{
		let thisOne = splits[i].trim();
		let tokens = thisOne.split("=");  // Split by = to get name/value pairs
		
		// Extract each piece of user data
		if( tokens[0] == "firstName" )
		{
			firstName = tokens[1];
		}
		else if( tokens[0] == "lastName" )
		{
			lastName = tokens[1];
		}
		else if( tokens[0] == "userId" )
		{
			userId = parseInt( tokens[1].trim() );  // Convert to number
		}
	}
	
	// If no valid userId found, user isn't logged in - redirect to login page
	if( userId < 0 )
	{
		window.location.href = "index.html";
	}
	else
	{
		// User is logged in - could display welcome message here

		document.getElementById("userName").innerHTML = "Logged in as " + firstName + " " + lastName;

	}
}

// LOGOUT FUNCTION - clears session data
function doLogout()
{
	// Reset all user data
	userId = 0;
	firstName = "";
	lastName = "";
	
	// Delete cookie by setting expiration to past date
	document.cookie = "firstName= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
	
	// Redirect back to login page
	window.location.href = "index.html";
}

function addContact()
{
	let firstName = document.getElementById("fname").value;
	let lastName = document.getElementById("lname").value;
	let phoneNumber = document.getElementById("number").value;
	let email = document.getElementById("email").value;
	
	document.getElementById("contactAddResult").innerHTML = "";

	let tmp = {
		firstName: firstName,
		lastName: lastName, 
		phoneNumber: phoneNumber,
		email: email,
		userId: userId
	};
	let jsonPayload = JSON.stringify( tmp );

	let url = urlBase + '/AddContact.' + extension;
	
	// Create AJAX request to send data to AddColor.php
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try
	{
		xhr.onreadystatechange = function() 
		{
			if (this.readyState == 4 && this.status == 200) 
			{
				document.getElementById("contactAddResult").innerHTML = "Contact has been added";
				document.getElementById("fname").value = "";
				document.getElementById("lname").value = "";
				document.getElementById("number").value = "";
				document.getElementById("email").value = "";

			}
		};
		// Send color data to PHP script
		xhr.send(jsonPayload);
	}
	catch(err)
	{
		document.getElementById("contactAddResult").innerHTML = err.message;
	}
}



function searchContact()
{
	// Get search term from HTML input
	let srch = document.getElementById("searchText").value;
	document.getElementById("contactSearchResult").innerHTML = "";

	let contactList = "";


	// Create JSON for SearchColors.php
	let tmp = {search:srch,userId:userId};
	let jsonPayload = JSON.stringify( tmp );


	let url = urlBase + '/SearchContacts.' + extension;

	
	// Create AJAX request
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try
	{
		xhr.onreadystatechange = function() 
		{
			if (this.readyState == 4 && this.status == 200) 
			{

				document.getElementById("contactSearchResult").innerHTML = "Contact(s) has been retrieved";

				let jsonObject = JSON.parse( xhr.responseText );
				
				// Loop through results array and format for display
				for( let i=0; i<jsonObject.results.length; i++ )
				{
					colorList += jsonObject.results[i];  // Add color name
					if( i < jsonObject.results.length - 1 )
					{
						colorList += "<br />\r\n";  // Add line break between colors
					}
				}
				

				// Display formatted contact list in first paragraph element
		
				document.getElementsByTagName("p")[0].innerHTML = contactList;
			}
		};
		// Send search request to PHP
		xhr.send(jsonPayload);
	}
	catch(err)
	{
		document.getElementById("contactSearchResult").innerHTML = err.message;
	}
}