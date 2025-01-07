import React from "react";

export type DropdownComponentProps = {
	name: string;
	description?: string;
	options: string[];
	value: string;
	onChange: (value: string) => void;
}

export const DropdownComponent: React.FC<DropdownComponentProps> = ({
	name,
	description,
	options,
	value,
	onChange,
}) => (
	<div className="infio-llm-setting-item">
		<div className="infio-llm-setting-item-name">{name}</div>
		{description && <div className="infio-llm-setting-item-description">{description}</div>}
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className="infio-llm-setting-item-control"
		>
			{options.map((option) => (
				<option key={option} value={option}>
					{option}
				</option>
			))}
		</select>
	</div>
);

export type TextComponentProps = {
	name: string;
	description?: string;
	placeholder: string;
	value: string;
	type?: string;
	onChange: (value: string) => void;
}

export const TextComponent: React.FC<TextComponentProps> = ({
	name,
	description,
	placeholder,
	value,
	type = "text",
	onChange,
}) => (
	<div className="infio-llm-setting-item">
		<div className="infio-llm-setting-item-name">{name}</div>
		{description && <div className="infio-llm-setting-item-description">{description}</div>}
		<input
			type={type}
			className="infio-llm-setting-item-control"
			placeholder={placeholder}
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
	</div>
);

export type ToggleComponentProps = {
	name?: string;
	description?: string;
	value: boolean;
	onChange: (value: boolean) => void;
	disabled?: boolean;
}

export const ToggleComponent: React.FC<ToggleComponentProps> = ({
	name,
	description,
	value,
	onChange,
	disabled = false,
}) => (
	<div className="infio-llm-setting-item">
		{name && <div className="infio-llm-setting-item-name">{name}</div>}
		{description && <div className="infio-llm-setting-item-description">{description}</div>}
		<label className={`switch ${disabled ? "disabled" : ""}`}>
			<input
				type="checkbox"
				checked={value}
				onChange={(e) => onChange(e.target.checked)}
				disabled={disabled}
			/>
			<span className="slider round"></span>
		</label>
	</div>
);
