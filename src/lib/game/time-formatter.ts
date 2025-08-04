export class TimeFormatter {

    private static addZero(input: number): string {
        if (input < 10) {
            return `0${input}`;
        } else {
            return `${input}`;
        }
    }

    static formatTime(time: number): string {
        const m = Math.floor(time / 60);
        const s = Math.round(time % 60);
        return `${TimeFormatter.addZero(m)}:${TimeFormatter.addZero(s)}`;
    }
}