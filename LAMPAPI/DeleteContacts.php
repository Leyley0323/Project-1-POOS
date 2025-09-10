<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$inData = json_decode(file_get_contents('php://input'), true) ?? [];

$userId    = intval($inData['userId']    ?? 0);
$contactId = intval($inData['contactId'] ?? 0);

if ($userId <= 0 || $contactId <= 0) {
  http_response_code(400);
  echo json_encode(["error"=>"Missing or invalid userId/contactId"]);
  exit;
}

$conn = new mysqli("localhost","TheBeast","WeLoveCOP4331","COP4331");
if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(["error"=>"DB connection failed"]);
  exit;
}

$stmt = $conn->prepare("DELETE FROM Contacts WHERE ID=? AND UserID=? LIMIT 1");
$stmt->bind_param("ii", $contactId, $userId);

if (!$stmt->execute()) {
  http_response_code(500);
  echo json_encode(["error"=>"Delete failed"]);
  $stmt->close(); $conn->close(); exit;
}

$rows = $stmt->affected_rows;
$stmt->close(); $conn->close();

if ($rows === 0) {
  echo json_encode(["deleted"=>false, "error"=>"No matching contact"]);
} else {
  echo json_encode(["deleted"=>true, "error"=>""]);
}