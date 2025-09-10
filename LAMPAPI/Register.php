
<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);
// Start PHP script - this file handles user registration (creating new accounts)

	// Get JSON data sent from JavaScript (via AJAX POST request)
	// JavaScript sends: {"firstName":"John","lastName":"Doe","login":"johndoe","password":"mypassword"}
	$inData = getRequestInfo();
	
	// Extract user registration data from the JSON request
	$firstName = $inData["firstName"];  // User's first name
	$lastName = $inData["lastName"];    // User's last name
	$login = $inData["login"];          // Desired username
	$password = $inData["password"];    // User's password (should be hashed in production)

	// Create connection to MySQL database
	// Parameters: host, username, password, database_name
	$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "COP4331");
	
	// Check if database connection failed
	if ($conn->connect_error) 
	{
		// Send error response back to JavaScript and stop execution
		returnWithError( $conn->connect_error );
	} 
	else
	{
		// Database connection successful - now check if username is available
		
		// STEP 1: Check if username already exists in database
		// Prepare SQL query to search for existing user with same login
		$stmt = $conn->prepare("SELECT ID FROM Users WHERE Login=?");
		// Bind the username to the placeholder (prevents SQL injection)
		$stmt->bind_param("s", $login);  // "s" means the parameter is a string
		// Execute the query to check for existing username
		$stmt->execute();
		// Get the result set
		$result = $stmt->get_result();
		
		// Check if any rows were returned (meaning username already exists)
		if ($result->num_rows > 0)
		{
			// USERNAME ALREADY TAKEN
			// Send error message back to JavaScript
			returnWithError("Username already exists");
		}
		else
		{
			// USERNAME IS AVAILABLE - proceed with registration
			
			// Close the previous statement before creating a new one
			$stmt->close();
			
			// STEP 2: Insert new user into database
			// Prepare SQL statement to insert new user record
			$stmt = $conn->prepare("INSERT INTO Users (FirstName, LastName, Login, Password) VALUES(?,?,?,?)");
			
			// Bind all the user data to the placeholders
			// "ssss" means all 4 parameters are strings
			// Maps to: firstName, lastName, Login, Password
			$stmt->bind_param("ssss", $firstName, $lastName, $login, $password);
			
			// Execute the INSERT statement
			$stmt->execute();
			
			// Check if the insertion was successful
			if ($stmt->affected_rows > 0)
			{
				// REGISTRATION SUCCESSFUL
				// Send success response (empty error message indicates success)
				// JavaScript will receive: {"error":""}
				returnWithError(""); // Success - empty error message
			}
			else
			{
				// REGISTRATION FAILED
				// Database insertion didn't work for some reason
				// JavaScript will receive: {"error":"Failed to create user"}
				returnWithError("Failed to create user");
			}
		}
		
		// Clean up database resources
		$stmt->close();    // Close the prepared statement
		$conn->close();    // Close the database connection
	}

	// HELPER FUNCTION: Read JSON data from HTTP request body
	function getRequestInfo()
	{
		// file_get_contents('php://input') reads raw POST data from JavaScript
		// json_decode() converts JSON string to PHP associative array
		// The 'true' parameter makes it return an array instead of object
		return json_decode(file_get_contents('php://input'), true);
	}

	// HELPER FUNCTION: Send JSON response back to JavaScript
	function sendResultInfoAsJson( $obj )
	{
		// Set HTTP header to tell browser this is JSON data
		header('Content-type: application/json');
		// Output the JSON string (this goes back to JavaScript AJAX call)
		echo $obj;
	}
	
	// HELPER FUNCTION: Create and send response (used for both success and error)
	function returnWithError( $err )
	{
		// Build JSON string with error field
		// Empty error ("") means success, any text means failure
		// JavaScript will receive: {"error":"message"} or {"error":""}
		$retValue = '{"error":"' . $err . '"}';
		// Send this JSON back to JavaScript
		sendResultInfoAsJson( $retValue );
	}
	

?>