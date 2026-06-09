import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formFieldErrorId } from './formFieldUtils';

type DatePickerFieldProps = {
  label: string;
  id: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
};

export function DatePickerField({
  label,
  id,
  value,
  onChange,
  placeholder = 'Pick a date',
  error,
  required = false,
  disabled = false,
}: DatePickerFieldProps): React.ReactElement {
  const errorId = formFieldErrorId(id);
  const buttonText = value ? format(value, 'dd/MM/yyyy') : placeholder;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  return (
    <FormField label={label} htmlFor={id} error={error} required={required}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
            )}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            aria-required={required || undefined}
          >
            <CalendarIcon className="mr-2 size-4" aria-hidden="true" />
            <span>{buttonText}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </FormField>
  );
}
