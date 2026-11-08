import { PageHeader } from '@/components/admin/PageHeader';
import { MoleculeForm } from '@/components/admin/MoleculeForm';

export default function NewMoleculePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add 3D Molecule"
        description="Define atomic Cartesian coordinates (x, y, z in Å), bond connectivity and orders, or import directly from PubChem."
      />
      <MoleculeForm />
    </div>
  );
}
