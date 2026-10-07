import Image from 'next/image';
import '@/styles/pages/flow.css';

export default function FlowFooter() {
  return (
    <footer className="flow-footer">
      <Image src="/moving-as-one.png" alt="Moving as one" width={250} height={89} />
    </footer>
  );
}