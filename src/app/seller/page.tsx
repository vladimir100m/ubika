import { StandardLayout } from '../../ui';
import SellerDashboardClient from '../../ui/SellerDashboard';
import { getPropertiesBySeller, getPropertyTypes, getPropertyStatuses, getPropertyFeatures, getPropertyOperationStatuses } from '../../lib/db';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function SellerDashboardPage() {
  const session = await getServerSession();
  const userId = (session?.user as any)?.sub || (session?.user as any)?.id;
  if (!userId) {
    redirect('/api/auth/signin');
  }

  const [
    sellerProperties,
    propertyTypes,
    propertyStatuses,
    features,
    propertyOperationStatuses,
  ] = await Promise.all([
    getPropertiesBySeller(userId),
    getPropertyTypes(),
    getPropertyStatuses(),
    getPropertyFeatures(),
    getPropertyOperationStatuses(),
  ]);

  return (
    <StandardLayout>
      <SellerDashboardClient
        initialSellerProperties={sellerProperties}
        propertyTypes={propertyTypes}
        propertyStatuses={propertyStatuses}
        features={features}
        propertyOperationStatuses={propertyOperationStatuses}
      />
    </StandardLayout>
  );
}
