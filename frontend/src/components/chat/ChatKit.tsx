// react/ChatKit.tsx (in your lib)
import * as React from "react";
import type { ChatKitControl, ToEventHandlerKey } from "../../hooks/useChatKit";
import type { ChatKitElement, ChatKitElementEventMap } from "@openai/chatkit";

export interface ChatKitProps extends React.HTMLAttributes<HTMLElement> {
  control: ChatKitControl;
}

export const ChatKit = React.forwardRef<HTMLElement, ChatKitProps>(
  function ChatKit({ control, ...htmlProps }, forwardedRef) {
    const ref = React.useRef<any>(null);

    React.useLayoutEffect(() => {
      if (!ref.current) return;

      const el = ref.current;

      if (customElements.get("openai-chatkit")) {
        el.setOptions(control.options);
        return;
      }

      let active = true;
      customElements.whenDefined("openai-chatkit").then(() => {
        if (active && ref.current) {
          ref.current.setOptions(control.options);
        }
      });
      return () => {
        active = false;
      };
    }, [control.options]);

    React.useEffect(() => {
      const el = ref.current;
      if (!el) return;

      const events = {
        "chatkit.error": "onError",
        "chatkit.response.end": "onResponseEnd",
        "chatkit.response.start": "onResponseStart",
        "chatkit.log": "onLog",
        "chatkit.thread.change": "onThreadChange",
      } satisfies {
        [K in keyof ChatKitElementEventMap]: ToEventHandlerKey<K>;
      };

      const abortController = new AbortController();

      for (const eventName of Object.keys(events) as (keyof typeof events)[]) {
        el.addEventListener(
          eventName,
          (e: Event) => {
            const handlerKey = events[eventName] as keyof typeof control.handlers;
            const handler = control.handlers[handlerKey] as ((detail: unknown) => void) | undefined;
            if (typeof handler === "function") {
              handler((e as CustomEvent).detail);
            }
          },
          { signal: abortController.signal },
        );
      }

      return () => {
        abortController.abort();
      };
    }, [control.handlers]);

    const setRefs = React.useCallback(
      (chatKit: ChatKitElement | null) => {
        ref.current = chatKit;
        control.setInstance(chatKit);
        if (typeof forwardedRef === "function") {
          forwardedRef(chatKit);
        } else if (forwardedRef) {
          forwardedRef.current = chatKit;
        }
      },
      [control, forwardedRef],
    );

    return <openai-chatkit ref={setRefs} {...htmlProps} />;
  },
);
