import React from 'react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer style={{
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #e5e5e5',
      padding: '20px 0',
      marginTop: '40px'
    }} className={className}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        textAlign: 'center'
      }}>
        <p style={{
          color: '#666',
          fontSize: '14px',
          margin: 0
        }}>&copy; {new Date().getFullYear()} Ubika - Leading real estate marketplace | Email: info@ubika.com</p>
      </div>
    </footer>
  );
};

export default Footer;
