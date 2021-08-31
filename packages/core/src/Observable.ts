export type Listener = (data: any) => void;
type Listeners = { subject: string, listener: Listener }[]

export class Observable {

    private listeners: Listeners = [];

    subcribe(subject: string, listener: Listener) {
        this.listeners.push({
            subject,
            listener
        });

        return () => {
            this.listeners = this.listeners
                .filter((value) => value.listener !== listener);
        }
    }

    push(subject: string, data: any) {
        const listeners = this.listeners
            .filter((value) => value.subject.startsWith(subject));

        listeners.forEach(value => value.listener(data));
    }

}
