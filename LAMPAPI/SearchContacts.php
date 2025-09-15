<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$inData = json_decode(file_get_contents('php://input'), true) ?? [];

$userId = intval($inData['userId'] ?? 0);
$term   = isset($inData['search']) ? trim($inData['search']) : '';

if ($userId <= 0) {
  echo json_encode(["results"=>[], "error"=>"Missing or invalid userId"]);
  exit;
}

$conn = new mysqli("localhost","TheBeast","WeLoveCOP4331","COP4331");
if ($conn->connect_error) {
  echo json_encode(["results"=>[], "error"=>"DB connection failed: ".$conn->connect_error]);
  exit;
}

if ($term === '') {
  // Empty search -> return all contacts for this user (optional; keep if you want)
  $stmt = $conn->prepare(
    "SELECT ID, FirstName, LastName, Phone, Email
     FROM Contacts
     WHERE UserID=?
     ORDER BY LastName, FirstName
     LIMIT 200"
  );
  $stmt->bind_param("i", $userId);
} else {
  $like = "%".$term."%";
  // ONLY FirstName / LastName substring match
  $stmt = $conn->prepare(
    "SELECT ID, FirstName, LastName, Phone, Email
     FROM Contacts
     WHERE UserID=?
       AND (FirstName LIKE ? OR LastName LIKE ?)
     ORDER BY LastName, FirstName
     LIMIT 200"
  );
  $stmt->bind_param("iss", $userId, $like, $like);
}

if (!$stmt->execute()) {
  echo json_encode(["results"=>[], "error"=>"Query failed: ".$stmt->error]);
  $stmt->close(); $conn->close(); exit;
}

$res = $stmt->get_result();
$out = [];
while ($row = $res->fetch_assoc()) { $out[] = $row; }

$stmt->close();
$conn->close();

echo json_encode(["results"=>$out, "error"=>""]);
