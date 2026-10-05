import Image from 'next/image';
import '@/styles/components/auth/auth-footer.css';

export default function AuthFooter() {
  return (
    <footer className="auth-footer">
      <Image src="/moving-as-one.png" alt="Moving as one" width={250} height={89} />
    </footer>
  );
}