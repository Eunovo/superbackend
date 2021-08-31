export type Listener = (subject: string, data: any) => void;
type Listeners = { subject: string, listener: Listener }[]

export class Observable {

    private listeners: Listeners = [];

    getObservableFor(subject: string) {
        const observable = new Observable();
        observable.subcribe(
            subject,
            (subj: string, data: any) =>
                this.push(`${subject}.${subj}`, data)
        );
        return observable;
    }

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

        listeners.forEach(value => value.listener(subject, data));
    }

}
