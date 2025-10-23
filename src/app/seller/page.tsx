import { StandardLayout } from '../../ui';
import SellerView from '../../ui/SellerView';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../pages/api/auth/[...nextauth]';
import { redirect } from 'next/navigation';

export default async function SellerPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.sub || (session?.user as any)?.id;
  
  if (!userId) {
    redirect('/api/auth/signin');
  }

  return (
    <StandardLayout>
      <SellerView userId={userId} />
    </StandardLayout>
  );
}
