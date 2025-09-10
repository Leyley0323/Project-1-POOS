<?php
	// Start PHP script - this file handles user login authentication

	// Get JSON data sent from JavaScript (via AJAX POST request)
	// JavaScript sends: {"login":"username","password":"password"}
	$inData = getRequestInfo();
	
	// Initialize variables to store user data if login is successful
	$id = 0;           // User ID from database
	$firstName = "";   // User's first name
	$lastName = "";    // User's last name

	// Create connection to MySQL database
	// Parameters: host, username, password, database_name
	$conn = new mysqli("localhost",  "TheBeast", "WeLoveCOP4331", "COP4331"); 	
	
	// Check if database connection failed
	if( $conn->connect_error )
	{
		// Send error response back to JavaScript and stop execution
		returnWithError( $conn->connect_error );
	}
	else
	{
		// Database connection successful - now check user credentials
		
		// Prepare SQL query to find user with matching login and password
		// The ? placeholders prevent SQL injection attacks
		$stmt = $conn->prepare("SELECT ID,firstName,lastName FROM Users WHERE Login=? AND Password =?");
		
		// Bind the actual values to the placeholders
		// "ss" means both parameters are strings
		// $inData["login"] and $inData["password"] come from JavaScript
		$stmt->bind_param("ss", $inData["login"], $inData["password"]);
		
		// Execute the prepared SQL statement
		$stmt->execute();
		
		// Get the result set from the query
		$result = $stmt->get_result();

		// Check if we found a matching user
		// fetch_assoc() returns one row as an associative array, or false if no rows
		if( $row = $result->fetch_assoc()  )
		{
			// LOGIN SUCCESSFUL - user exists with correct credentials
			// Send user data back to JavaScript
			returnWithInfo( $row['firstName'], $row['lastName'], $row['ID'] );
		}
		else
		{
			// LOGIN FAILED - no user found with those credentials
			// Send error message back to JavaScript
			returnWithError("No Records Found");
		}

		// Clean up database resources
		$stmt->close();    // Close the prepared statement
		$conn->close();    // Close the database connection
	}
	
	// HELPER FUNCTION: Read JSON data from HTTP request body
	function getRequestInfo()
	{
		// file_get_contents('php://input') reads raw POST data
		// json_decode() converts JSON string to PHP associative array
		// The 'true' parameter makes it return an array instead of object
		return json_decode(file_get_contents('php://input'), true);
	}

	// HELPER FUNCTION: Send JSON response back to JavaScript
	function sendResultInfoAsJson( $obj )
	{
		// Set HTTP header to tell browser this is JSON data
		header('Content-type: application/json');
		// Output the JSON string (this goes back to JavaScript)
		echo $obj;
	}
	
	// HELPER FUNCTION: Create and send error response
	function returnWithError( $err )
	{
		// Build JSON string with empty user data and error message
		// JavaScript will receive: {"id":0,"firstName":"","lastName":"","error":"error message"}
		$retValue = '{"id":0,"firstName":"","lastName":"","error":"' . $err . '"}';
		// Send this JSON back to JavaScript
		sendResultInfoAsJson( $retValue );
	}
	
	// HELPER FUNCTION: Create and send success response with user data
	function returnWithInfo( $firstName, $lastName, $id )
	{
		// Build JSON string with user data and empty error field
		// JavaScript will receive: {"id":123,"firstName":"John","lastName":"Doe","error":""}
		$retValue = '{"id":' . $id . ',"firstName":"' . $firstName . '","lastName":"' . $lastName . '","error":""}';
		// Send this JSON back to JavaScript
		sendResultInfoAsJson( $retValue );
	}
	
?>