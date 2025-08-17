import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  onCreateNew?: (value: string) => Promise<void>;
  placeholder?: string;
  emptyText?: string;
  createText?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  onCreateNew,
  placeholder = "Select option...",
  emptyText = "No options found.",
  createText = "Create",
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const showCreateOption = onCreateNew && searchValue && 
    !filteredOptions.some(option => option.label.toLowerCase() === searchValue.toLowerCase());

  const handleCreateNew = async () => {
    if (!onCreateNew || !searchValue.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreateNew(searchValue.trim());
      setSearchValue('');
      setOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedOption && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or type to create..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {showCreateOption ? (
                <div className="p-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleCreateNew}
                    disabled={isCreating}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {createText} "{searchValue}"
                  </Button>
                </div>
              ) : (
                emptyText
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    setSearchValue('');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {showCreateOption && filteredOptions.length > 0 && (
                <CommandItem
                  onSelect={handleCreateNew}
                  disabled={isCreating}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {createText} "{searchValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}