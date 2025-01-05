import { Platform } from 'obsidian';
import React from 'react';

const ShortcutInfo: React.FC = () => {
	const modKey = Platform.isMacOS ? 'Cmd' : 'Ctrl';

	const shortcuts = [
		{
			label: 'Edit inline',
			shortcut: `${modKey}+Shift+K`,
		},
		{
			label: 'Chat with select',
			shortcut: `${modKey}+Shift+L`,
		},
		{
			label: 'Submit with vault',
			shortcut: `${modKey}+Shift+Enter`,
		}
	];

	return (
		<div className="infio-shortcut-info">
			<table className="infio-shortcut-table">
				<tbody>
					{shortcuts.map((item, index) => (
						<tr key={index} className="infio-shortcut-item">
							<td className="infio-shortcut-label">{item.label}</td>
							<td className="infio-shortcut-key"><kbd>{item.shortcut}</kbd></td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default ShortcutInfo;
