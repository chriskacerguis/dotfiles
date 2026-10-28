import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * A button that asks before it acts — for a decision that tells someone else
 * the outcome and cannot be quietly undone. The trigger is the `children`
 * button; `onConfirm` runs only from the dialog's own confirm button, and the
 * dialog closes before it does, so whatever the page shows next is not hidden
 * behind it.
 */
export function ConfirmDialog({ title, description, confirmLabel, confirmVariant = 'default', onConfirm, children }) {
  const [open, setOpen] = useState(false);

  function confirm() {
    setOpen(false);
    onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={confirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
