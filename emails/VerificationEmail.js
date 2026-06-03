'use strict';

var LOGO_URL = 'https://vipenonline.com/images/VipenLogo.png';

function VerificationEmail(params) {
  var code = (params && params.code) ? params.code : '000000';

  return (
    '<!DOCTYPE html>\n' +
    '<html lang="zh-CN">\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>Vipen Verification Code</title>\n' +
    '</head>\n' +
    '<body style="' +
    'background-color:#f4f4f7;' +
    'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;' +
    'padding:40px 0;' +
    'margin:0;' +
    '">\n' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">\n' +
    '<tr>\n' +
    '<td align="center">\n' +
    '<table width="480" cellpadding="0" cellspacing="0" style="' +
    'background-color:#ffffff;' +
    'border-radius:12px;' +
    'padding:40px 32px;' +
    'text-align:center;' +
    'box-shadow:0 2px 8px rgba(0,0,0,0.06);' +
    'max-width:480px;' +
    '">\n' +
    '<tr>\n' +
    '<td align="center" style="padding-bottom:16px;">\n' +
    '<img src="' + LOGO_URL + '" alt="Vipen" width="64" height="64" style="' +
    'width:64px;height:64px;border-radius:12px;display:block;outline:none;border:none;' +
    '">\n' +
    '</td>\n' +
    '</tr>\n' +
    '<tr>\n' +
    '<td align="center" style="' +
    'color:#32c864;font-size:24px;font-weight:700;padding-bottom:8px;' +
    '">Vipen</td>\n' +
    '</tr>\n' +
    '<tr>\n' +
    '<td align="center" style="' +
    'color:#666666;font-size:16px;padding-bottom:28px;' +
    '">您的验证码</td>\n' +
    '</tr>\n' +
    '<tr>\n' +
    '<td align="center" style="padding-bottom:28px;">\n' +
    '<div style="' +
    'background-color:#f9fafb;' +
    'border-radius:8px;' +
    'padding:20px 32px;' +
    'display:inline-block;' +
    'border:1px solid #e5e7eb;' +
    '">\n' +
    '<span style="' +
    'font-size:36px;' +
    'font-weight:900;' +
    'letter-spacing:10px;' +
    'color:#32c864;' +
    'font-family:\'Courier New\',Courier,monospace;' +
    '">' + code + '</span>\n' +
    '</div>\n' +
    '</td>\n' +
    '</tr>\n' +
    '<tr>\n' +
    '<td align="center" style="color:#999999;font-size:13px;padding-bottom:8px;">验证码10分钟内有效</td>\n' +
    '</tr>\n' +
    '<tr>\n' +
    '<td align="center" style="color:#aaaaaa;font-size:12px;">如果您没有请求此验证码，请忽略此邮件。</td>\n' +
    '</tr>\n' +
    '</table>\n' +
    '</td>\n' +
    '</tr>\n' +
    '</table>\n' +
    '</body>\n' +
    '</html>'
  );
}

module.exports = VerificationEmail;