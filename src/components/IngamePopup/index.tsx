import { Button } from "antd";
import { useCallback } from "react";

export interface IngamePopupProps {
  onClick;
  disabled;
    
}
export const IngamePopup = (props: IngamePopupProps) => {
 // const { setVisible } = useWalletModal();
  const { onClick, disabled, ...rest } = props;

  const handleOkClick: React.MouseEventHandler<HTMLElement> = useCallback(
    (event) => {
      //setVisible(false);
      onClick?.(event);
      return;
    },
    [onClick]
  );

  // only show if wallet selected or user connected
  const popupWindow = (
    <div>
        <Button
            {...rest}
            onClick={handleOkClick}
            disabled={false}
            >
            {"ok"}
        </Button>
    </div>
  );
  return popupWindow;
};
