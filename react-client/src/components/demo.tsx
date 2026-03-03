import { LiquidButton } from "@/components/ui/liquid-glass-button";

export default function DemoOne() {
    return (
        <>
            <div className="relative h-[200px] w-full flex items-center justify-center p-8 glass-panel overflow-hidden">
                <LiquidButton className="z-10 text-lg shadow-lg">
                    Liquid Glass
                </LiquidButton>
            </div>
        </>
    )
}
