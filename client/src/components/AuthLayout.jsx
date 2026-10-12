// Layout for Login / Register: navbar, the photo stage with a glass panel, and the brand strip from the Figma footer.
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Logo from './Logo';

export default function AuthLayout() {
  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-stage photo-bg">
          <div className="container">
            <Outlet />
          </div>
        </div>
        <div className="brand-strip">
          <div className="container">
            <Logo showText={false} />
            <p>
              Our home repair brand is built on trust, reliability, and quality craftsmanship. We provide quick, professional solutions
              for all your home maintenance needs, from minor fixes to essential repairs, ensuring your home stays safe, comfortable, and well cared for.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
