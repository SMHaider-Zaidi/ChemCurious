import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Access Restricted
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your current account does not have administrative privileges to view this section.
          Contact the ChemCurious site administrator if you believe this is an error.
        </p>
        <div className="pt-4">
          <Button asChild variant="default">
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Student Website
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
