export default function PageHeader({ title, description, action }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 mb-6 border-b border-border gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}