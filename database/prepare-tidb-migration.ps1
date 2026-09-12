param(
  [Parameter(Mandatory = $true)]
  [string]$Source,

  [string]$Destination = (Join-Path $PSScriptRoot 'tigre_burger_pos_tidb.sql')
)

$ErrorActionPreference = 'Stop'

$sql = Get-Content -LiteralPath $Source -Raw -Encoding UTF8
$tableOrder = @(
  'roles',
  'usuarios',
  'categorias',
  'productos',
  'mesas',
  'metodos_pago',
  'cajas',
  'ventas',
  'detalle_ventas',
  'venta_pagos',
  'whatsapp_messages'
)

$blocks = @{}
$matches = [regex]::Matches(
  $sql,
  '(?ms)^--\r?\n-- Table structure for table `(?<name>[^`]+)`\r?\n--\r?\n(?<body>.*?)(?=^--\r?\n-- Table structure for table `|^/\*!40103 SET TIME_ZONE)'
)

foreach ($match in $matches) {
  $name = $match.Groups['name'].Value
  $body = $match.Groups['body'].Value

  $body = [regex]::Replace($body, '(?m)^DROP TABLE IF EXISTS `[^`]+`;\r?\n', '')
  $body = [regex]::Replace($body, '(?m)^LOCK TABLES .*?;\r?\n', '')
  $body = [regex]::Replace($body, '(?m)^UNLOCK TABLES;\r?\n', '')
  $body = [regex]::Replace($body, '(?m)^/\*!40000 ALTER TABLE .*? (?:DISABLE|ENABLE) KEYS \*/;\r?\n', '')
  $body = [regex]::Replace($body, '(?m)^/\*!40101 SET @saved_cs_client.*?\r?\n', '')
  $body = [regex]::Replace($body, '(?m)^/\*!50503 SET character_set_client.*?\r?\n', '')
  $body = [regex]::Replace($body, '(?m)^/\*!40101 SET character_set_client.*?\r?\n', '')

  if ($name -eq 'whatsapp_messages') {
    $body = [regex]::Replace(
      $body,
      '(?ms)^--\r?\n-- Dumping data for table `whatsapp_messages`\r?\n--\r?\n\s*INSERT INTO `whatsapp_messages` VALUES .*?;\r?\n',
      "--`r`n-- WhatsApp message data intentionally omitted (private data).`r`n--`r`n"
    )
  }

  $blocks[$name] = $body.Trim()
}

$missing = $tableOrder | Where-Object { -not $blocks.ContainsKey($_) }
if ($missing.Count -gt 0) {
  throw "Missing expected tables in source dump: $($missing -join ', ')"
}

$header = @'
-- Tigre Burger POS - TiDB Cloud migration
-- Generated from the supplied MariaDB/MySQL dump.
-- WhatsApp message rows are intentionally excluded because they contain private conversations.
-- This script replaces existing tables in the tigre_burger_pos database.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `tigre_burger_pos`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `tigre_burger_pos`;

DROP TABLE IF EXISTS `detalle_ventas`;
DROP TABLE IF EXISTS `venta_pagos`;
DROP TABLE IF EXISTS `ventas`;
DROP TABLE IF EXISTS `cajas`;
DROP TABLE IF EXISTS `productos`;
DROP TABLE IF EXISTS `categorias`;
DROP TABLE IF EXISTS `mesas`;
DROP TABLE IF EXISTS `metodos_pago`;
DROP TABLE IF EXISTS `usuarios`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `whatsapp_messages`;
'@

$parts = [System.Collections.Generic.List[string]]::new()
$parts.Add($header.Trim())
foreach ($table in $tableOrder) {
  $parts.Add("-- Table: $table`r`n$($blocks[$table])")
}
$parts.Add('SET FOREIGN_KEY_CHECKS = 1;')

$output = ($parts -join "`r`n`r`n") + "`r`n"
[System.IO.File]::WriteAllText($Destination, $output, [System.Text.UTF8Encoding]::new($false))

Write-Host "Created: $Destination"
Write-Host "Tables: $($tableOrder.Count)"
Write-Host 'WhatsApp rows: excluded'
