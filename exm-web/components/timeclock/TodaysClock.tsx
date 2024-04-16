"use client"

import { FunctionComponent } from "react"
import { Timer } from "lucide-react"

import { Button } from "../ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

interface TodaysClockProps {}

const TodaysClock: FunctionComponent<TodaysClockProps> = () => {
  const onClick = () => {}

  return (
    <div className="p-4 flex items-center flex-col gap-4 bg-white rounded-2xl border">
      <div className="flex items-center w-full">
        <h3 className="text-2xl font-bold">Today's clock</h3>

        <div className="px-3 py-2 border rounded-xl ml-auto gap-2 flex items-center">
          <span className="text-[#667085]">Total work hours today</span>
          <b>00:00</b>
        </div>
      </div>

      <Popover>
        <PopoverTrigger>
          <Button
            className="w-[198px] h-[198px] bg-primary rounded-full flex flex-col items-center gap-4 justify-center text-white text-xl"
            onClick={onClick}
          >
            <Timer size={66} />

            <b>Clock in</b>
          </Button>
        </PopoverTrigger>
        <PopoverContent>hello</PopoverContent>
      </Popover>
    </div>
  )
}

export default TodaysClock
