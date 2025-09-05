<?php
// Start PHP script - this file handles adding new contacts to the database

// Get JSON data sent from JavaScript (via AJAX POST request)
// JavaScript sends: {"userId":123,"firstName":"John","lastName":"Doe","phone":"555-1234","email":"john@email.com"}
$inData = getRequestInfo();

// Create connection to MySQL database
// Parameters: host, username, password, database_name
$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "COP4331");

// Check if database connection failed
if ($conn->connect_error) 
{
    // Send error response back to JavaScript and stop execution
    returnWithError($conn->connect_error);
} 
else
{
    // Database connection successful - now add the new contact
    
    // Prepare SQL statement to insert a new contact into the Contacts table
    // The ? placeholders prevent SQL injection attacks
    // Table structure: UserID (int), FirstName (string), LastName (string), Phone (string), Email (string)
    $stmt = $conn->prepare("INSERT INTO Contacts (UserID, FirstName, LastName, Phone, Email) VALUES (?, ?, ?, ?, ?)");
    
    // Bind the actual values from JavaScript to the placeholders
    // "issss" means: integer (userId), string, string, string, string
    // Maps to: UserID, FirstName, LastName, Phone, Email
    $stmt->bind_param("issss", $inData["userId"], $inData["firstName"], $inData["lastName"], $inData["phone"], $inData["email"]);

    // Execute the prepared SQL statement and check if it was successful
    if ($stmt->execute()) 
    {
        // CONTACT ADDED SUCCESSFULLY
        // Send success message back to JavaScript
        returnWithInfo("Contact added successfully");
    } 
    else 
    {
        // CONTACT ADDITION FAILED
        // Send error message with details about what went wrong
        returnWithError("Failed to add contact: " . $stmt->error);
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
function sendResultInfoAsJson($obj)
{
    // Set HTTP header to tell browser this is JSON data
    header('Content-type: application/json');
    // Output the JSON string (this goes back to JavaScript AJAX call)
    echo $obj;
}

// HELPER FUNCTION: Create and send error response
function returnWithError($err)
{
    // Build JSON string with error message
    // JavaScript will receive: {"error":"error message here"}
    $retValue = '{"error":"' . $err . '"}';
    // Send this JSON back to JavaScript
    sendResultInfoAsJson($retValue);
}

// HELPER FUNCTION: Create and send success response
function returnWithInfo($message)
{
    // Build JSON string with success message and empty error field
    // JavaScript will receive: {"message":"Contact added successfully","error":""}
    $retValue = '{"message":"' . $message . '","error":""}';
    // Send this JSON back to JavaScript
    sendResultInfoAsJson($retValue);
}

?>