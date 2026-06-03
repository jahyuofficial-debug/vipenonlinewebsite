const {
  Html,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Img
} = require('@react-email/components');
const React = require('react');

const LOGO_URL = 'https://vipenonline.com/images/VipenLogo.png';

const main = {
  backgroundColor: '#f4f4f7',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  padding: '40px 0',
};

const container = {
  maxWidth: '480px',
  margin: '0 auto',
};

const card = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '40px 32px',
  textAlign: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};

const logo = {
  width: '64px',
  height: '64px',
  borderRadius: '12px',
  marginBottom: '16px',
  display: 'block',
  outline: 'none',
  border: 'none',
  textDecoration: 'none',
};

const brandName = {
  color: '#32c864',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 8px',
};

const subtitle = {
  color: '#666666',
  fontSize: '16px',
  margin: '0 0 28px',
  fontWeight: '400',
};

const codeBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px 32px',
  marginBottom: '28px',
  display: 'inline-block',
  border: '1px solid #e5e7eb',
};

const codeText = {
  fontSize: '36px',
  fontWeight: '900',
  letterSpacing: '10px',
  color: '#32c864',
  margin: '0',
  fontFamily: '"Courier New", Courier, monospace',
};

const expireText = {
  color: '#999999',
  fontSize: '13px',
  margin: '0 0 8px',
};

const footerText = {
  color: '#aaaaaa',
  fontSize: '12px',
  margin: '0',
};

function VerificationEmail({ code = '000000' }) {
  return React.createElement(
    Html,
    { lang: 'zh-CN' },
    React.createElement(
      Body,
      { style: main },
      React.createElement(
        Container,
        { style: container },
        React.createElement(
          Section,
          { style: card },
          React.createElement(Img, { src: LOGO_URL, alt: 'Vipen', style: logo }),
          React.createElement(Heading, { style: brandName }, 'Vipen'),
          React.createElement(Text, { style: subtitle }, '您的验证码'),
          React.createElement(
            Section,
            { style: codeBox },
            React.createElement(Text, { style: codeText }, code)
          ),
          React.createElement(Text, { style: expireText }, '验证码10分钟内有效'),
          React.createElement(
            Text,
            { style: footerText },
            '如果您没有请求此验证码，请忽略此邮件。'
          )
        )
      )
    )
  );
}

module.exports = VerificationEmail;