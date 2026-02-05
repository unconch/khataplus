"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"

interface DatePickerWithRangeProps {
    className?: string
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
    open: boolean
    setOpen: (open: boolean) => void
}

export function DatePickerWithRange({
    className,
    date,
    setDate,
    open,
    setOpen
}: DatePickerWithRangeProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    // Internal state for pending selection before "Apply"
    const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(date)

    // Sync internal state when prop changes externally (e.g. clear)
    React.useEffect(() => {
        setInternalDate(date)
    }, [date])

    const handleApply = () => {
        setDate(internalDate)
        setOpen(false)
    }

    const handleCancel = () => {
        setInternalDate(date)
        setOpen(false)
    }

    if (isDesktop) {
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("w-9 px-0", className)}
                    >
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="border-b p-4">
                        <h4 className="font-semibold leading-none mb-1">Select Dates</h4>
                        <p className="text-sm text-primary font-medium">
                            {internalDate?.from ? (
                                internalDate.to ? (
                                    <>
                                        {format(internalDate.from, "LLL dd, y")} - {format(internalDate.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(internalDate.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </p>
                    </div>
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={internalDate}
                        onSelect={setInternalDate}
                        numberOfMonths={2}
                    />
                    <div className="p-3 border-t flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
                        <Button size="sm" onClick={handleApply}>Apply Range</Button>
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("w-9 px-0", className)}
                >
                    <CalendarIcon className="h-4 w-4" />
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader className="border-b pb-4">
                        <DrawerTitle className="text-center">Select Dates</DrawerTitle>
                        <DrawerDescription className="text-center text-primary font-medium mt-1 text-base">
                            {internalDate?.from ? (
                                internalDate.to ? (
                                    <>
                                        {format(internalDate.from, "LLL dd")} - {format(internalDate.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(internalDate.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 flex justify-center">
                        <Calendar
                            mode="range"
                            defaultMonth={date?.from}
                            selected={internalDate}
                            onSelect={setInternalDate}
                            numberOfMonths={1}
                            className="border rounded-md"
                        />
                    </div>
                    <DrawerFooter className="border-t pt-4">
                        <Button className="w-full" onClick={handleApply}>Apply Range</Button>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full" onClick={handleCancel}>Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
