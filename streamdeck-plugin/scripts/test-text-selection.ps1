Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = 'ContextDeck selection test'
$form.StartPosition = 'CenterScreen'
$form.Size = New-Object System.Drawing.Size(520, 150)
$form.TopMost = $true

$textBox = New-Object System.Windows.Forms.TextBox
$textBox.Multiline = $true
$textBox.Text = 'This text is selected to test the ContextDeck Text profile.'
$textBox.Dock = 'Fill'
$textBox.Font = New-Object System.Drawing.Font('Segoe UI', 14)
$form.Controls.Add($textBox)

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 30000
$timer.Add_Tick({
  $timer.Stop()
  $form.Close()
})

$form.Add_Shown({
  $textBox.Focus()
  $textBox.SelectAll()
  $timer.Start()
})

[void]$form.ShowDialog()
