import { PageHeader } from '@/components/admin/PageHeader';
import { ReactionForm } from '@/components/admin/ReactionForm';

export default function NewReactionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Chemical Reaction"
        description="Configure reactant and product molecules, stoichiometric coefficients, and simulated laboratory conditions."
      />
      <ReactionForm />
    </div>
  );
}
