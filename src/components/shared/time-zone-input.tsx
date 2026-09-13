import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { TIME_ZONE_SUGGESTIONS } from "@/lib/time-zones";

interface TimeZoneInputProps
  extends Omit<ComponentProps<typeof Input>, "id" | "list"> {
  id: string;
}

export function TimeZoneInput({ id, ...props }: TimeZoneInputProps) {
  const suggestionListId = `${id}-suggestions`;

  return (
    <>
      <Input
        {...props}
        id={id}
        list={suggestionListId}
        autoComplete="off"
        spellCheck={false}
      />
      <datalist id={suggestionListId}>
        {TIME_ZONE_SUGGESTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </datalist>
    </>
  );
}
