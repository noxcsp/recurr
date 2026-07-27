import { SuccessScreen } from '@/components/success-screen'

function SuccessPage() {
    return (
        <SuccessScreen
            title="Success"
            description="Your account and all associated data have been permanently wiped."
            redirectTo="/"
            redirectDelaySeconds={3}
        />
    )
}

export default SuccessPage;