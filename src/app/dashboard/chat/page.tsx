import Wrapper from "@/components/layouts/DefaultWrapper";
import MetaData from "@/hooks/useMetaData";
import ChatContent from "./ChatContent";

export default function ChatPage() {
  return (
    <MetaData pageTitle="Chat - AfriHR">
      <Wrapper>
        <ChatContent />
      </Wrapper>
    </MetaData>
  );
}
