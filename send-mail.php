<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: https://www.regulatec.cl");
header("Access-Control-Allow-Methods: POST");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    exit(json_encode(["error" => "Method not allowed"]));
}

$raw  = file_get_contents("php://input");
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    exit(json_encode(["error" => "Invalid JSON"]));
}

$nombre  = htmlspecialchars(strip_tags($data["nombre"]  ?? ""), ENT_QUOTES, "UTF-8");
$empresa = htmlspecialchars(strip_tags($data["empresa"] ?? ""), ENT_QUOTES, "UTF-8");
$email   = filter_var($data["email"] ?? "", FILTER_SANITIZE_EMAIL);
$cargo   = htmlspecialchars(strip_tags($data["cargo"]   ?? "No indicado"), ENT_QUOTES, "UTF-8");

if (!$nombre || !$empresa || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    exit(json_encode(["error" => "Datos inválidos"]));
}

$to      = "ventas@regulatec.cl";
$subject = "=?UTF-8?B?" . base64_encode("Nuevo diagnóstico — " . $empresa) . "?=";
$fecha   = date("d/m/Y H:i");

$body = '<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb">
  <div style="background:#0A1F44;padding:24px 32px;border-bottom:4px solid #C9A84C">
    <h1 style="color:#fff;margin:0;font-size:20px">Nueva solicitud de diagnóstico</h1>
    <p style="color:rgba(255,255,255,.6);margin:6px 0 0;font-size:13px">regulatec.cl — ' . $fecha . '</p>
  </div>
  <div style="padding:28px;background:#fff">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="background:#F3F4F6;padding:10px 14px;font-weight:bold;width:120px;font-size:14px">Nombre</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-size:14px">' . $nombre . '</td>
      </tr>
      <tr>
        <td style="background:#F3F4F6;padding:10px 14px;font-weight:bold;font-size:14px">Empresa</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-size:14px">' . $empresa . '</td>
      </tr>
      <tr>
        <td style="background:#F3F4F6;padding:10px 14px;font-weight:bold;font-size:14px">Email</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-size:14px">
          <a href="mailto:' . $email . '" style="color:#0A1F44">' . $email . '</a>
        </td>
      </tr>
      <tr>
        <td style="background:#F3F4F6;padding:10px 14px;font-weight:bold;font-size:14px">Cargo</td>
        <td style="padding:10px 14px;font-size:14px">' . $cargo . '</td>
      </tr>
    </table>
    <div style="margin-top:20px;padding:14px 18px;background:#F0FDF4;border-left:4px solid #1E8449;border-radius:4px">
      <p style="margin:0;color:#1E8449;font-weight:bold;font-size:14px">
        ✓ Responder en menos de 24 horas a: <a href="mailto:' . $email . '" style="color:#1E8449">' . $email . '</a>
      </p>
    </div>
  </div>
  <div style="padding:16px 28px;background:#f3f4f6;font-size:11px;color:#9ca3af;text-align:center">
    Enviado desde regulatec.cl · ' . $fecha . '
  </div>
</body></html>';

$boundary = md5(uniqid());
$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "From: RegulaTec Web <noreply@regulatec.cl>\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

$sent = mail($to, $subject, $body, $headers);

if ($sent) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "mail() failed"]);
}
?>
