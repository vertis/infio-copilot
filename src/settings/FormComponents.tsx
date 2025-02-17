import React, { useEffect, useState } from "react";

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
			className="infio-llm-setting-item-control, infio-llm-setting-model-id"
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
	name?: string;
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
}) => {
	const [localValue, setLocalValue] = useState(value);

	// Update local value when prop value changes (e.g., provider change)
	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setLocalValue(e.target.value);
	};

	const handleBlur = () => {
		if (localValue !== value) {
			onChange(localValue);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.currentTarget.blur();
		}
	};

	return (
		<div className="infio-llm-setting-item">
			<div className="infio-llm-setting-item-name">{name}</div>
			{description && <div className="infio-llm-setting-item-description">{description}</div>}
			<input
				type={type}
				className="infio-llm-setting-item-control"
				placeholder={placeholder}
				value={localValue}
				onChange={handleChange}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
			/>
		</div>
	);
};

export type ToggleComponentProps = {
	name: string;
	value: boolean;
	onChange: (value: boolean) => void;
	disabled?: boolean;
}

export const ToggleComponent: React.FC<ToggleComponentProps> = ({
	name,
	value,
	onChange,
	disabled = false,
}) => (
	<div className="infio-llm-setting-item">
		<label className={`switch ${disabled ? "disabled" : ""}`}>
			<input
				type="checkbox"
				checked={value}
				onChange={(e) => onChange(e.target.checked)}
				disabled={disabled}
			/>
			<span className="infio-llm-setting-checkbox-name">{name}</span>
		</label>
	</div>
);
