import { Children, cloneElement, isValidElement } from 'react';
import { Label } from '@/components/ui/label';

/**
 * One labelled control on a form: the label, the control, then either
 * the field's refusal (a 422's `details.fields` entry) or its hint. The control
 * is the single child; it is given the id, `aria-invalid` and `aria-describedby`
 * so the error is read out with it.
 */
export function Field({ id, label, required, optional, hint, error, children, className }) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const control = Children.only(children);

  return (
    <div className={className ?? 'space-y-1.5'}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
        {optional ? <span className="ml-1 font-normal text-muted-foreground">(optional)</span> : null}
      </Label>
      {isValidElement(control)
        ? cloneElement(control, { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })
        : control}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
