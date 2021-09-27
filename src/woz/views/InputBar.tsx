import * as React from "react"
// import {IInputBar} from "../model/DialogueModel"
import css from "./InputBar.module.css"



interface InputBarStyle {
    width: any

}

interface Props{
    props: any
}

export class InputBar extends React.Component<InputBarStyle, Props> {
    constructor({props}: Props) {
        super(props)
        // this.state = { items: [], text: '' }
        this.onMessageSent = this.onMessageSent.bind(this)
    }

    private onMessageSent(e: Event) {
        e.preventDefault()
        /*if (this.state.text.length === 0) {
            return
        }
        const newItem = {
            text: this.state.text,
            id: Date.now()
        }
        this.setState(state => ({
            items: state.items.concat(newItem),
            text: ''
        }))*/
    }

    public render() {
        return (<form id="chat-form"/*onSubmit={this.onMessageSent}*/>
            <input
                id="chat-input"
                /*value={this.state.text}*/
            />
            <button>
                Send
            </button>
        </form>)
    }
}