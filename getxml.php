<?php
// Simple secure XML endpoint: getxml.php?file=xml/data.xml
$root = __DIR__;
$xmlDir = realpath($root . DIRECTORY_SEPARATOR . 'xml');
if ($xmlDir === false) {
  http_response_code(500);
  echo "XML directory not found";
  exit;
}

$file = isset($_GET['file']) ? $_GET['file'] : '';
// normalize and prevent traversal
$file = str_replace(['..','\\','/../'], '', $file);
$requested = realpath($root . DIRECTORY_SEPARATOR . $file);

if ($requested === false || stripos($requested, $xmlDir) !== 0 || substr($requested, -4) !== '.xml') {
  http_response_code(404);
  header('Content-Type: text/plain; charset=utf-8');
  echo "Not found";
  exit;
}

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
readfile($requested);