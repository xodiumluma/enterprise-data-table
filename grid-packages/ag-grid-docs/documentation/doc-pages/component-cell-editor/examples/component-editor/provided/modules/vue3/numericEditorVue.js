import {nextTick} from 'vue';

// backspace starts the editor on Windows
const KEY_BACKSPACE = 'Backspace';
const KEY_F2 = 'F2';
const KEY_ENTER = 'Enter';
const KEY_TAB = 'Tab';

export default {
    template: `<input :ref="'input'" @keydown="onKeyDown($event)" v-model="value" class="numeric-input" />`,
    data() {
        return {
            value: '',
            cancelBeforeStart: true,
            highlightAllOnFocus: true
        };
    },
    methods: {
        getValue() {
            const value = this.value;
            return value === '' || value == null ? null : parseInt(value);
        },

        isCancelBeforeStart() {
            return this.cancelBeforeStart;
        },

        setInitialState(params) {
            let startValue;
            let highlightAllOnFocus = true;
            const eventKey = params.eventKey;

            if (eventKey === KEY_BACKSPACE) {
                // if backspace or delete pressed, we clear the cell
                startValue = '';
            } else if (eventKey && eventKey.length === 1) {
                // if a letter was pressed, we start with the letter
                startValue = eventKey;
                highlightAllOnFocus = false;
            } else {
                // otherwise we start with the current value
                startValue = params.value;
                if (eventKey === KEY_F2) {
                    highlightAllOnFocus = false;
                }
            }

            this.value = startValue;
            this.highlightAllOnFocus = highlightAllOnFocus;
        },

        // will reject the number if it greater than 1,000,000
        // not very practical, but demonstrates the method.
        isCancelAfterEnd() {
            const value = this.getValue();
            return value != null && value > 1000000;
        },

        onKeyDown(event) {
            if (this.isLeftOrRight(event) || this.isBackspace(event)) {
                event.stopPropagation();
                return;
            }

            if (!this.finishedEditingPressed(event) && !this.isNumericKey(event)) {
                if (event.preventDefault) event.preventDefault();
            }
        },

        isCharNumeric(charStr) {
            return /\d/.test(charStr);
        },

        isNumericKey(event) {
            const charStr = event.key;
            return this.isCharNumeric(charStr);
        },

        finishedEditingPressed(event) {
            const key = event.key;
            return key === KEY_ENTER || key === KEY_TAB;
        },

        isBackspace(event) {
            return event.key === KEY_BACKSPACE;
        },

        isLeftOrRight(event) {
            return ['ArrowLeft', 'ArrowRight'].indexOf(event.key) > -1;
        }
    },

    created() {
        this.setInitialState(this.params);
        
        const eventKey = this.params.eventKey;
        const isCharacter = eventKey && eventKey.length === 1;

        // only start edit if key pressed is a number, not a letter
        this.cancelBeforeStart =
            isCharacter && '1234567890'.indexOf(eventKey) < 0;
    },
    mounted() {

        nextTick(() => {
            // need to check if the input reference is still valid - if the edit was cancelled before it started there
            // wont be an editor component anymore
            if (this.$refs.input) {
                this.$refs.input.focus();
                if (this.highlightAllOnFocus) {
                    this.$refs.input.select();

                    this.highlightAllOnFocus = false;
                } else {
                    // when we started editing, we want the caret at the end, not the start.
                    // this comes into play in two scenarios: 
                    //   a) when user hits F2 
                    //   b) when user hits a printable character
                    const length = this.$refs.input.value ? this.$refs.input.value.length : 0;
                    if (length > 0) {
                        this.$refs.input.setSelectionRange(length, length);
                    }
                }

                this.$refs.input.focus();
            }
        });
    },
};
