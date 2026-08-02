import { useState } from 'react';
import type { ComponentType, JSX } from 'react';
import { cn } from '@/lib/utils';

export interface ComponentEntry {
  name: string;
  description: string;
  preview: ComponentType;
}

interface ComponentsViewProps {
  components: ComponentEntry[];
}

export function ComponentsView({
  components,
}: ComponentsViewProps): JSX.Element {
  const [selectedName, setSelectedName] = useState<string>(
    components[0]?.name ?? '',
  );

  const selected =
    components.find((c) => c.name === selectedName) ?? components[0];

  const heading = (
    <div className="mb-6">
      <h1>Components</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Reusable component library
      </p>
    </div>
  );

  if (!selected) {
    return (
      <>
        {heading}
        <div className="rounded-lg border border-border p-6 text-muted-foreground">
          No components registered yet.
        </div>
      </>
    );
  }

  const Preview = selected.preview;

  return (
    <>
      {heading}
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <select
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm md:hidden"
          value={selected.name}
          onChange={(e) => setSelectedName(e.target.value)}
          aria-label="Select a component"
        >
          {components.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <nav
          className="hidden max-h-[70vh] w-56 shrink-0 overflow-y-auto md:block"
          aria-label="Components"
        >
          <ul className="flex flex-col gap-1">
            {components.map((c) => {
              const isActive = c.name === selected.name;
              return (
                <li key={c.name}>
                  <button
                    type="button"
                    onClick={() => setSelectedName(c.name)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'bg-transparent text-foreground font-normal hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {c.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="flex-1">
          <h2 className="text-lg font-medium text-foreground">
            {selected.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {selected.description}
          </p>
          <div className="mt-4 rounded-lg border border-border p-6">
            <Preview />
          </div>
        </section>
      </div>
    </>
  );
}
