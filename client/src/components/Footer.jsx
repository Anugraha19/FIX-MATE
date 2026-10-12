import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <Logo />
            <p style={{ marginTop: 14 }}>
              Our home repair brand is built on trust, reliability, and quality craftsmanship. We provide quick, professional solutions
              for all your home maintenance needs, from minor fixes to essential repairs, ensuring your home stays safe, comfortable, and well cared for.
            </p>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About FixMate</Link></li>
              <li><Link to="/providers">Our providers</Link></li>
              <li><Link to="/contact">Contact us</Link></li>
            </ul>
          </div>
          <div>
            <h4>Services</h4>
            <ul>
              <li><Link to="/services?category=Plumbing">Plumbing</Link></li>
              <li><Link to="/services?category=Electrical">Electrical</Link></li>
              <li><Link to="/services?category=AC%20Repair">AC repair</Link></li>
              <li><Link to="/services">All services</Link></li>
            </ul>
          </div>
          <div>
            <h4>Your account</h4>
            <ul>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Create an account</Link></li>
              <li><Link to="/customer/bookings">My bookings</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">&copy; {new Date().getFullYear()} FixMate Home Repair Services. Built as a BCA Full Stack Development project.</div>
      </div>
    </footer>
  );
}
