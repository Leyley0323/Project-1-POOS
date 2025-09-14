<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$inData = getRequestInfo();

$userId    = intval($inData['userId']    ?? 0);
$contactId = intval($inData['contactId'] ?? 0);

$first = $inData['firstName'] ?? null;
$last  = $inData['lastName']  ?? null;
$phone = $inData['phone']     ?? null;
$email = $inData['email']     ?? null;

if ($userId <= 0 || $contactId <= 0) {
    returnWithError("Missing or invalid userId/contactId");
    exit;
}

$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "COP4331");
if ($conn->connect_error) {
    returnWithError("DB connection failed: " . $conn->connect_error);
    exit;
}

// build SET clause dynamically
$fields = [];
$params = [];
$types  = "";

if ($first !== null) { $fields[] = "FirstName=?"; $params[] = $first; $types .= "s"; }
if ($last  !== null) { $fields[] = "LastName=?";  $params[] = $last;  $types .= "s"; }
if ($phone !== null) { $fields[] = "Phone=?";     $params[] = $phone; $types .= "s"; }
if ($email !== null) { $fields[] = "Email=?";     $params[] = $email; $types .= "s"; }

if (empty($fields)) {
    returnWithError("No fields provided to update");
    exit;
}

$sql = "UPDATE Contacts SET " . implode(", ", $fields) . " WHERE ID=? AND UserID=? LIMIT 1";
$stmt = $conn->prepare($sql);

$types .= "ii";
$params[] = $contactId;
$params[] = $userId;

$stmt->bind_param($types, ...$params);

if (!$stmt->execute()) {
    returnWithError("Update failed: " . $stmt->error);
    $stmt->close(); $conn->close();
    exit;
}

if ($stmt->affected_rows === 0) {
    returnWithError("No matching contact or no changes made");
    $stmt->close(); $conn->close();
    exit;
}

$stmt->close();

// fetch updated record
$get = $conn->prepare("SELECT ID, FirstName, LastName, Phone, Email, UserID FROM Contacts WHERE ID=? AND UserID=?");
$get->bind_param("ii", $contactId, $userId);
$get->execute();
$res = $get->get_result();
$row = $res->fetch_assoc();

$get->close(); $conn->close();

sendResultInfoAsJson(json_encode(["updated"=>true, "contact"=>$row, "error"=>""]));


// --- helpers ---
function getRequestInfo()
{
    return json_decode(file_get_contents('php://input'), true);
}
function sendResultInfoAsJson($obj)
{
    echo $obj;
}
function returnWithError($err)
{
    sendResultInfoAsJson(json_encode(["updated"=>false, "error"=>$err]));
}
?>
