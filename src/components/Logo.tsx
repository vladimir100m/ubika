import Image from 'next/image';

const Logo = () => {
  return (
    <div className="logo">
      <Image src="/ubika-logo.png" alt="Ubika Logo" width={50} height={50} />
    </div>
  );
};

export default Logo;