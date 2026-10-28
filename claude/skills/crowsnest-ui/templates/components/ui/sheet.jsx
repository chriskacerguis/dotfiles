import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A panel that slides in from an edge — the mobile navigation. Built on the
 * Dialog primitive, so it traps focus, closes on Escape and restores focus to
 * the button that opened it.
 */
const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const sheetVariants = cva(
  'fixed z-50 flex flex-col gap-4 overflow-y-auto bg-background p-4 shadow-lg data-[state=open]:animate-fade-in',
  {
    variants: {
      side: {
        left: 'inset-y-0 left-0 h-full w-72 max-w-[85vw] border-r',
        right: 'inset-y-0 right-0 h-full w-72 max-w-[85vw] border-l',
      },
    },
    defaultVariants: { side: 'left' },
  },
);

const SheetContent = React.forwardRef(function SheetContent({ side, className, children, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-fade-in" />
      <DialogPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-3 top-3 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100">
          <X className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

const SheetTitle = React.forwardRef(function SheetTitle({ className, ...props }, ref) {
  return <DialogPrimitive.Title ref={ref} className={cn('text-base font-semibold', className)} {...props} />;
});

const SheetDescription = React.forwardRef(function SheetDescription({ className, ...props }, ref) {
  return <DialogPrimitive.Description ref={ref} className={cn('sr-only', className)} {...props} />;
});

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription };
