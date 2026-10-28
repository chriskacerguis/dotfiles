import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
 * The confirm for something that cannot be undone and is easy to aim at the
 * wrong target — destroying a cloud resource. The person types the thing's own
 * name (`expected`) before the confirm button works, so a destroy means having
 * looked at what is being destroyed.
 */
export function TypedConfirmDialog({ title, description, expected, typeLabel, confirmLabel, onConfirm, children }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const inputId = useId();
  const matches = typed.trim() === expected;

  function change(next) {
    setOpen(next);
    if (!next) setTyped('');
  }

  function confirm(event) {
    event.preventDefault();
    if (!matches) return;
    change(false);
    onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={confirm}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-1.5">
            <Label htmlFor={inputId}>
              {typeLabel} <span className="font-mono text-destructive">{expected}</span>
            </Label>
            <Input id={inputId} className="font-mono" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => change(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={!matches}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
